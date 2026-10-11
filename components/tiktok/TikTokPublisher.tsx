'use client';

import { useMemo, useState } from 'react';
import { Check, ChevronLeft, ChevronRight, Eye, Film, LockKeyhole, Play, ShieldCheck, Sparkles, Upload, WandSparkles } from 'lucide-react';

const caption = 'Un sándwich que se ve brutal y sabe todavía mejor 🥑🍗\n\nPan tostado, pollo, pesto cremoso y una buena capa de aguacate. ¿Lo probarías?\n\n#TusAguacates #Aguacate #Sandwich #RecetasFaciles #ComidaCasera';

const steps = [
  { label: 'Cuenta', icon: ShieldCheck },
  { label: 'Video', icon: Film },
  { label: 'Copy', icon: WandSparkles },
  { label: 'Privacidad', icon: Eye },
  { label: 'Listo', icon: Check },
];

export default function TikTokPublisher() {
  const [step, setStep] = useState(0);
  const [connected, setConnected] = useState(false);
  const [selected, setSelected] = useState(false);
  const [draftCaption, setDraftCaption] = useState(caption);
  const [privacy, setPrivacy] = useState('SELF_ONLY');
  const [comments, setComments] = useState(true);
  const [duet, setDuet] = useState(true);
  const [stitch, setStitch] = useState(true);

  const progress = useMemo(() => `${step + 1} / ${steps.length}`, [step]);
  const canContinue = step === 0 ? connected : step === 1 ? selected : true;

  function next() {
    if (canContinue) setStep((current) => Math.min(current + 1, steps.length - 1));
  }

  function back() {
    setStep((current) => Math.max(current - 1, 0));
  }

  return (
    <main className="min-h-screen bg-[#07180f] px-4 pb-10 pt-5 text-[#f4f7ef] sm:px-6">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-5">
        <header className="flex items-center justify-between gap-4">
          <a href="/" className="flex items-center gap-2 text-sm font-semibold text-[#d7e7cf]" aria-label="Volver a Tus Aguacates">
            <span className="grid h-9 w-9 place-items-center rounded-full border border-[#c8a227]/50 bg-[#0d2818] text-lg">🥑</span>
            <span>TusAguacates.com</span>
          </a>
          <span className="rounded-full border border-[#c8a227]/35 bg-[#0d2818]/80 px-3 py-1.5 text-xs font-semibold tracking-wide text-[#f0d879]">Creator Studio</span>
        </header>

        <section className="rounded-[28px] border border-white/10 bg-[#0d2818]/90 p-5 shadow-2xl shadow-black/20 sm:p-7">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-[#c8a227]">Publicar en TikTok</p>
              <h1 className="font-display text-3xl font-extrabold leading-tight sm:text-4xl">Lleva una idea rica al feed.</h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-[#d3dfd0]">Selecciona, revisa y prepara tu contenido antes de publicarlo desde Tus Aguacates.</p>
            </div>
            <div className="hidden rounded-2xl border border-[#c8a227]/30 bg-[#07180f] px-3 py-2 text-right sm:block">
              <div className="text-xs text-[#9eb29b]">Paso</div>
              <div className="text-lg font-bold text-[#f0d879]">{progress}</div>
            </div>
          </div>

          <div className="mb-7 grid grid-cols-5 gap-1.5" aria-label={`Progreso: ${progress}`}>
            {steps.map((item, index) => {
              const Icon = item.icon;
              const active = index === step;
              const done = index < step;
              return (
                <div key={item.label} className="flex min-w-0 flex-col items-center gap-1.5 text-center">
                  <div className={`grid h-9 w-9 place-items-center rounded-full border transition ${active ? 'border-[#c8a227] bg-[#c8a227] text-[#07180f]' : done ? 'border-[#6b8e23] bg-[#6b8e23]/30 text-[#d7e7cf]' : 'border-white/15 bg-white/5 text-[#9eb29b]'}`}>
                    <Icon size={16} aria-hidden="true" />
                  </div>
                  <span className={`truncate text-[10px] font-semibold sm:text-xs ${active ? 'text-[#f0d879]' : 'text-[#9eb29b]'}`}>{item.label}</span>
                </div>
              );
            })}
          </div>

          {step === 0 && (
            <div className="space-y-5">
              <div className="rounded-2xl border border-[#6b8e23]/40 bg-[#07180f]/70 p-4">
                <div className="flex gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#c8a227]/15 text-[#f0d879]"><ShieldCheck size={20} /></div>
                  <div>
                    <h2 className="font-bold">Conecta tu cuenta de TikTok</h2>
                    <p className="mt-1 text-sm leading-5 text-[#b7c8b3]">La cuenta autorizada aparecerá aquí antes de elegir el video.</p>
                  </div>
                </div>
              </div>
              {connected ? (
                <div className="flex items-center justify-between rounded-2xl border border-[#6b8e23] bg-[#6b8e23]/15 p-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#a8d58a]">Conectada</p>
                    <p className="mt-1 font-bold">Tusaguacates.com</p>
                  </div>
                  <Check className="text-[#a8d58a]" aria-label="Cuenta conectada" />
                </div>
              ) : (
                <button onClick={() => setConnected(true)} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#c8a227] px-5 py-4 text-base font-extrabold text-[#07180f] transition hover:bg-[#f0d879] focus:outline-none focus:ring-2 focus:ring-[#f0d879] focus:ring-offset-2 focus:ring-offset-[#0d2818]">
                  <ShieldCheck size={20} /> Conectar TikTok
                </button>
              )}
              <p className="flex items-center gap-2 text-xs text-[#9eb29b]"><LockKeyhole size={14} /> Tus credenciales y tokens no se muestran en esta pantalla.</p>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <div>
                <p className="text-sm font-bold text-[#f0d879]">Elige un video aprobado</p>
                <p className="mt-1 text-sm text-[#b7c8b3]">La primera demo usa un video vertical de 43 segundos.</p>
              </div>
              <div className={`overflow-hidden rounded-3xl border-2 transition ${selected ? 'border-[#c8a227]' : 'border-white/10'}`}>
                <div className="relative aspect-[9/16] max-h-[430px] bg-black">
                  <video className="h-full w-full object-contain" controls playsInline preload="metadata" poster="/tiktok/demo-sandwich-cover.jpg" src="/tiktok/demo-sandwich.mp4" />
                  <div className="pointer-events-none absolute left-3 top-3 rounded-full bg-[#07180f]/85 px-3 py-1 text-xs font-bold text-[#f0d879]">Video aprobado</div>
                </div>
                <div className="flex items-center justify-between gap-3 bg-[#07180f] p-4">
                  <div><p className="font-bold">Sándwich de pollo y aguacate</p><p className="mt-1 text-xs text-[#9eb29b]">MP4 · 43 s · vertical · 8,09 MB</p></div>
                  <button onClick={() => setSelected((value) => !value)} className={`rounded-xl px-4 py-2 text-sm font-bold ${selected ? 'bg-[#6b8e23] text-white' : 'bg-[#c8a227] text-[#07180f]'}`}>{selected ? 'Seleccionado' : 'Seleccionar'}</button>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-bold text-[#f0d879]"><WandSparkles size={17} /> Revisa el copy</div>
              <label className="block"><span className="mb-2 block text-xs font-bold uppercase tracking-wide text-[#9eb29b]">Caption para TikTok</span><textarea value={draftCaption} onChange={(event) => setDraftCaption(event.target.value)} rows={9} className="w-full resize-none rounded-2xl border border-white/10 bg-[#07180f] p-4 text-sm leading-6 text-[#f4f7ef] outline-none ring-[#c8a227] placeholder:text-[#789078] focus:ring-2" /></label>
              <div className="flex items-start gap-3 rounded-2xl border border-[#c8a227]/25 bg-[#c8a227]/10 p-4 text-sm text-[#d9e5cf]"><Sparkles size={18} className="mt-0.5 shrink-0 text-[#f0d879]" /><p>El copy evita precios, fechas y promesas no verificadas.</p></div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <div><p className="text-sm font-bold text-[#f0d879]">Privacidad y controles</p><p className="mt-1 text-sm text-[#b7c8b3]">En Sandbox, TikTok solo permite probar con SELF_ONLY.</p></div>
              <label className="block"><span className="mb-2 block text-xs font-bold uppercase tracking-wide text-[#9eb29b]">Privacidad</span><select value={privacy} onChange={(event) => setPrivacy(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-[#07180f] px-4 py-3.5 text-sm font-bold text-[#f4f7ef] outline-none focus:ring-2 focus:ring-[#c8a227]"><option value="SELF_ONLY">Solo yo (prueba Sandbox)</option><option value="PUBLIC_TO_EVERYONE" disabled>Público (requiere aprobación TikTok)</option></select></label>
              <div className="space-y-2">
                {[['Permitir comentarios', comments, setComments], ['Permitir duetos', duet, setDuet], ['Permitir stitches', stitch, setStitch]].map(([label, value, setter]) => <label key={label as string} className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#07180f]/70 px-4 py-3.5 text-sm font-semibold"><span>{label as string}</span><input type="checkbox" checked={value as boolean} onChange={(event) => (setter as (value: boolean) => void)(event.target.checked)} className="h-5 w-5 accent-[#c8a227]" /></label>)}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-5 text-center">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#6b8e23]/25 text-[#b8df45]"><Check size={30} /></div>
              <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#b8df45]">Listo para publicar</p><h2 className="mt-2 font-display text-2xl font-extrabold">La demo queda preparada</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#b7c8b3]">En la siguiente fase conectaremos este botón con Composio y mostraremos el estado real del publish_id.</p></div>
              <div className="rounded-2xl border border-[#c8a227]/25 bg-[#07180f] p-4 text-left text-sm"><p><span className="text-[#9eb29b]">Cuenta:</span> <strong>Tusaguacates.com</strong></p><p className="mt-2"><span className="text-[#9eb29b]">Privacidad:</span> <strong>{privacy}</strong></p><p className="mt-2"><span className="text-[#9eb29b]">Contenido orgánico:</span> <strong>Sí</strong></p></div>
              <button disabled className="flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-2xl bg-white/10 px-5 py-4 text-base font-extrabold text-white/45"><Upload size={19} /> Publicar en TikTok (fase 2)</button>
            </div>
          )}

          <div className="mt-7 flex items-center justify-between gap-3 border-t border-white/10 pt-5">
            <button onClick={back} disabled={step === 0} className="flex items-center gap-1 rounded-xl px-3 py-2 text-sm font-bold text-[#b7c8b3] transition hover:bg-white/5 disabled:invisible"><ChevronLeft size={17} /> Atrás</button>
            {step < steps.length - 1 && <button onClick={next} disabled={!canContinue} className="flex items-center gap-1 rounded-xl bg-[#c8a227] px-5 py-3 text-sm font-extrabold text-[#07180f] transition hover:bg-[#f0d879] disabled:cursor-not-allowed disabled:opacity-40">Continuar <ChevronRight size={17} /></button>}
          </div>
        </section>

        <p className="text-center text-xs leading-5 text-[#9eb29b]">Vista de preparación para la integración TikTok · No se publica nada en esta fase.</p>
      </div>
    </main>
  );
}
