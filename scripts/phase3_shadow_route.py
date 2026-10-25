#!/usr/bin/env python3
"""Generate deterministic, read-only Phase 3 shadow routes for Spoke."""
import argparse, csv, hashlib, json, os, pathlib, re, time, urllib.parse, urllib.request
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

ROOT = pathlib.Path(__file__).resolve().parents[1]
OUT_ROOT = pathlib.Path('/opt/data/cache/phase3-shadow-routes')
BOGOTA = ZoneInfo('America/Bogota')
CORABASTOS = {'lat': 4.63205, 'lng': -74.15534, 'address': 'Corabastos, Bogotá'}
MAX_STOPS = 10
CONFIRMED = {'confirmado','confirmed','pendiente_entrega','pending_delivery','pagado','paid','processing','en_ruta','pendiente','pending'}


def env():
    d={}
    for line in pathlib.Path('/opt/data/.env.tusaguacates').read_text().splitlines():
        if '=' in line and not line.startswith('#'):
            k,v=line.split('=',1); d[k]=v.strip().strip('"').strip("'")
    return d

V=env(); H={'apikey':V['SUPABASE_SERVICE_ROLE_KEY_TUSAGUACATES'],'Authorization':'Bearer '+V['SUPABASE_SERVICE_ROLE_KEY_TUSAGUACATES']}

def fetch(table):
    rows=[]
    for offset in range(0,5000,1000):
        u=V['SUPABASE_URL_TUSAGUATES'] if 'SUPABASE_URL_TUSAGUATES' in V else V['SUPABASE_URL_TUSAGUACATES']
        req=urllib.request.Request(f"{u}/rest/v1/{table}?select=*&limit=1000&offset={offset}",headers=H)
        page=json.loads(urllib.request.urlopen(req).read())
        rows.extend(page)
        if len(page)<1000: break
    return rows

def parse_dt(value):
    if not value: return None
    try:
        s=str(value).replace('Z','+00:00'); d=datetime.fromisoformat(s)
        if d.tzinfo is None: d=d.replace(tzinfo=BOGOTA)
        return d.astimezone(BOGOTA)
    except Exception: return None

def get_day(row):
    od=row.get('order_data') or {}
    if isinstance(od, str):
        try: od=json.loads(od)
        except Exception: od={}
    for key in ('delivery_date','deliveryDate','scheduled_delivery_date','fecha_entrega'):
        v=row.get(key) or (od.get(key) if isinstance(od,dict) else None)
        if v: return str(v)[:10]
    created=parse_dt(row.get('created_at'))
    if not created: return None
    weekday=created.weekday()  # Mon=0 ... Sun=6
    hour=created.hour
    if weekday < 1: delta=1-weekday
    elif weekday == 1: delta=0 if hour < 10 else 3
    elif weekday < 4: delta=4-weekday
    elif weekday == 4: delta=0 if hour < 10 else 4
    else: delta=1 if weekday == 5 else 1
    return (created + timedelta(days=delta)).date().isoformat()

def get_status(row):
    return str(row.get('status') or row.get('order_status') or '').strip().lower()

def get_address(row):
    od=row.get('order_data') or {}; structured=od.get('address_structured') or {}
    snap=row.get('shipping_address') or row.get('shipping_address_snapshot') or {}
    if not isinstance(snap,dict): snap={}
    text=row.get('guest_address') or row.get('delivery_address') or structured.get('rawAddress') or snap.get('street_address') or snap.get('address') or ''
    lat=structured.get('latitude') if structured else None; lng=structured.get('longitude') if structured else None
    lat=lat if lat is not None else snap.get('latitude'); lng=lng if lng is not None else snap.get('longitude')
    return str(text or ''), lat, lng, structured.get('pin_confidence') or ('pin' if lat is not None and lng is not None else 'sin_pin')

def point_in_ring(p, ring):
    x,y=p; inside=False
    for i in range(len(ring)):
        j=i-1; xi,yi=ring[i]; xj,yj=ring[j]
        if (yi>y)!=(yj>y) and x < (xj-xi)*(y-yi)/(yj-yi)+xi: inside=not inside
    return inside

def coverage(lat,lng,geo):
    if lat is None or lng is None: return 'no_pin', None
    matches=[]
    for f in geo['features']:
        if f['geometry']['type']=='Polygon' and point_in_ring((float(lng),float(lat)),f['geometry']['coordinates'][0]): matches.append(f['properties'].get('tipo'))
    if 'exclusion' in matches or 'roja' in matches: return 'fuera', 'zona_excluida'
    if 'entrega' in matches: return 'verde', 'zona_verde'
    return 'por_confirmar', 'fuera_de_poligonos'

def geocode(text, cache):
    key=text.strip().lower()
    if not key: return None
    if key in cache: return cache[key]
    params=urllib.parse.urlencode({'format':'jsonv2','addressdetails':'1','limit':'5','countrycodes':'co','bounded':'1','viewbox':'-74.25,4.85,-73.95,4.45','q':text})
    req=urllib.request.Request('https://nominatim.openstreetmap.org/search?'+params,headers={'User-Agent':'TusAguacates/phase3-shadow-route'})
    try:
        rows=json.loads(urllib.request.urlopen(req,timeout=20).read())
    except Exception:
        rows=[]
    result=None
    if rows:
        x=rows[0]; a=x.get('address') or {}
        confidence='alta' if a.get('house_number') and (a.get('city') or a.get('town') or a.get('municipality')) else 'media'
        result={'lat':float(x['lat']),'lng':float(x['lon']),'confidence':confidence,'label':x.get('display_name','')}
    cache[key]=result
    time.sleep(1 if rows else 0.2)
    return result

def main():
    ap=argparse.ArgumentParser(); ap.add_argument('--date',required=True); ap.add_argument('--cutoff',default='06:00'); args=ap.parse_args()
    target=args.date; cutoff=datetime.fromisoformat(f'{target}T{args.cutoff}:00').replace(tzinfo=BOGOTA)
    out=OUT_ROOT/pathlib.Path(target); out.mkdir(parents=True,exist_ok=True)
    geo=json.loads((ROOT/'config/zonas-entrega.geojson').read_text())
    cache_path=out/'geocode-cache.json'; cache=json.loads(cache_path.read_text()) if cache_path.exists() else {}
    candidates=[]; report={'date':target,'cutoff':cutoff.isoformat(),'source':'Supabase guest_orders + orders','routes':[],'counts':{'orders_total':0,'eligible_confirmed':0,'no_delivery_date':0,'outside_cutoff':0,'no_address':0,'no_pin':0,'geocoded_high':0,'geocoded_low':0,'verde':0,'por_confirmar':0,'fuera':0,'routed':0}}
    for table in ('guest_orders','orders'):
        for row in fetch(table):
            report['counts']['orders_total']+=1
            if get_day(row)!=target: continue
            if get_status(row) not in CONFIRMED: continue
            confirmed=parse_dt(row.get('confirmed_at') or row.get('created_at'))
            if confirmed and confirmed>cutoff: report['counts']['outside_cutoff']+=1; continue
            report['counts']['eligible_confirmed']+=1
            text,lat,lng,pin=get_address(row); item={'source':table,'id':row.get('id'),'address':text,'phone_suffix':re.sub(r'\D','',str(row.get('guest_phone') or ''))[-4:],'status':get_status(row),'resolution':None,'coverage':None,'lat':None,'lng':None}
            if not text: item['resolution']='verificar_barrio'; report['counts']['no_address']+=1; candidates.append(item); continue
            if lat is None or lng is None:
                g=geocode(text,cache)
                if not g: item['resolution']='verificar_barrio'; report['counts']['no_pin']+=1; candidates.append(item); continue
                if g['confidence']!='alta': item['resolution']='verificar_barrio'; report['counts']['geocoded_low']+=1; candidates.append(item); continue
                lat,lng=g['lat'],g['lng']; item['resolution']='geocodificado'; report['counts']['geocoded_high']+=1
            else: item['resolution']='pin'
            item['lat'],item['lng']=float(lat),float(lng); cov,reason=coverage(item['lat'],item['lng'],geo); item['coverage']=cov
            if cov=='verde': report['counts']['verde']+=1; candidates.append(item)
            elif cov=='fuera': report['counts']['fuera']+=1; candidates.append(item)
            else: report['counts']['por_confirmar']+=1; candidates.append(item)
    cache_path.write_text(json.dumps(cache,ensure_ascii=False,sort_keys=True,indent=2))
    routed=[x for x in candidates if x['coverage']=='verde' and x['lat'] is not None]
    routed.sort(key=lambda x:(x['lat'],x['lng'],x['id'] or ''))
    report['counts']['routed']=len(routed); report['counts']['routes']=(len(routed)+MAX_STOPS-1)//MAX_STOPS
    for idx in range(report['counts']['routes']):
        part=routed[idx*MAX_STOPS:(idx+1)*MAX_STOPS]; name=f'Ruta {idx+1}'
        csv_path=out/f'spoke-{idx+1}.csv'
        with csv_path.open('w',newline='',encoding='utf-8') as f:
            w=csv.DictWriter(f,fieldnames=['lat','lng','address','note']); w.writeheader()
            for x in part: w.writerow({'lat':x['lat'],'lng':x['lng'],'address':x['address'],'note':f"{x['source']}:{x['id']} | resolución={x['resolution']} | cobertura=verde"})
        report['routes'].append({'name':name,'file':str(csv_path),'stops':len(part),'start':CORABASTOS,'end':CORABASTOS,'order_ids':[x['id'] for x in part]})
    (out/'orders-classification.json').write_text(json.dumps(candidates,ensure_ascii=False,sort_keys=True,indent=2))
    (out/'route-report.json').write_text(json.dumps(report,ensure_ascii=False,sort_keys=True,indent=2))
    # deterministic preview HTML with a map; it never writes to Supabase or Spoke
    markers=json.dumps([{'lat':x['lat'],'lng':x['lng'],'address':x['address']} for x in candidates if x['lat'] is not None],ensure_ascii=False)
    geo_json=json.dumps(geo,ensure_ascii=False)
    counts_html=json.dumps(report['counts'],ensure_ascii=False,indent=2)
    preview=f'''<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Fase 3 sombra {target}</title><link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"><style>body{{font-family:system-ui;margin:20px}}#map{{height:560px;max-width:1100px;border:1px solid #ccc}}pre{{background:#f5f5f5;padding:12px}}</style></head><body><h1>Ruta sombra {target}</h1><p>Rutas: {report['counts']['routes']} · Paradas: {report['counts']['routed']} · Salida/llegada: Corabastos</p><pre>{counts_html}</pre><div id="map"></div><script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script><script>const markers={markers};const geo={geo_json};const map=L.map('map').setView([{CORABASTOS['lat']},{CORABASTOS['lng']}],11);L.tileLayer('https://{{s}}.tile.openstreetmap.org/{{z}}/{{x}}/{{y}}.png',{{maxZoom:19,attribution:'© OpenStreetMap contributors'}}).addTo(map);L.geoJSON(geo,{{style:f=>({{color:f.properties.tipo==='exclusion'?'#b91c1c':'#15803d',fillOpacity:.18,weight:2}})}}).addTo(map);L.marker([{CORABASTOS['lat']},{CORABASTOS['lng']}]).addTo(map).bindPopup('Salida/llegada: Corabastos');markers.forEach((x,i)=>L.marker([x.lat,x.lng]).addTo(map).bindPopup((i+1)+'. '+x.address));if(markers.length)map.fitBounds(L.featureGroup(markers.map(x=>L.marker([x.lat,x.lng]))).getBounds().pad(.1));</script></body></html>'''
    (out/'preview.html').write_text(preview)

    print(json.dumps({'date':target,'output_dir':str(out),'counts':report['counts'],'routes':report['routes']},ensure_ascii=False))

if __name__=='__main__': main()
