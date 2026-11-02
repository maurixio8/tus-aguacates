import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient, verifyAdminAuth } from '@/lib/auth-admin';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { deliveryDateOf, isRouteEligible } from '@/lib/admin-route';
import { formatPurchaseQuantity } from '@/lib/purchase-list-format';

export const dynamic = 'force-dynamic';

/**
 * Exportación server-side de la Lista de Compras.
 * Genera el archivo (CSV/XLS/PDF) en el servidor y lo devuelve como
 * descarga HTTP real (Content-Disposition: attachment).
 * Esto funciona en CUALQUIER navegador, incluido Arc Android, porque
 * usa el gestor de descargas nativo (no data URLs ni blobs client-side).
 */

interface ExportItem {
  productName: string;
  variantName: string | null;
  quantity: number;
  unitPrice: number;
  customerName: string;
  customerAddress: string;
}

interface ExportProduct {
  product_name: string;
  variant_name?: string | null;
  purchase_text?: string | null;
  total_quantity: number;
  total_physical_units?: number;
  physical_unit_name?: string | null;
  smallest_weight_grams?: number;
  total_in_smallest_units?: number;
  customer_breakdown?: any[];
}

function extractOrderItems(order: any): ExportItem[] {
  const items: ExportItem[] = [];
  const customerName = order.customer_name || order.guest_name || 'Cliente sin nombre';
  const customerAddress =
    order.delivery_address ||
    order.order_data?.customer?.address ||
    order.order_data?.delivery_address ||
    order.guest_address ||
    '';

  const rawItems = order.order_data?.items || order.order_items || order.items || [];

  rawItems.forEach((item: any) => {
    const name =
      item.product_snapshot?.name ||
      item.products?.name ||
      item.product_name ||
      item.productName ||
      'Producto sin nombre';
    const variant =
      item.variantName ||
      item.variant_name ||
      item.product_snapshot?.variant_name ||
      item.variant_value ||
      item.product_snapshot?.variant_value ||
      null;
    const qty = item.quantity || 0;
    const price = item.unit_price || item.price || 0;

    items.push({
      productName: name,
      variantName: variant,
      quantity: qty,
      unitPrice: price,
      customerName,
      customerAddress,
    });
  });

  return items;
}

function groupProducts(items: ExportItem[]) {
  const map = new Map<string, any>();

  items.forEach(item => {
    const key = `${item.productName}|${item.variantName || ''}`;
    if (!map.has(key)) {
      map.set(key, {
        product_name: item.productName,
        variant_name: item.variantName,
        unit_price: item.unitPrice,
        total_quantity: 0,
        customer_breakdown: [] as any[],
      });
    }
    const entry = map.get(key);
    entry.total_quantity += item.quantity;
    if (item.unitPrice > 0) entry.unit_price = item.unitPrice;

    const existingCustomer = entry.customer_breakdown.find(
      (c: any) => c.customer_name === item.customerName
    );
    if (existingCustomer) {
      existingCustomer.quantity += item.quantity;
    } else {
      entry.customer_breakdown.push({
        customer_name: item.customerName,
        customer_address: item.customerAddress,
        quantity: item.quantity,
      });
    }
  });

  return Array.from(map.values()).sort((a, b) =>
    a.product_name.localeCompare(b.product_name, 'es')
  );
}

function formatCOP(value: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function normalizeText(value: unknown): string {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

function weightFromVariant(variant: string | null | undefined): number | null {
  const text = normalizeText(variant);
  if (!text) return null;
  if (/^(kilo|kilos|kg)$/.test(text)) return 1000;
  const match = text.match(/(\d+(?:\.\d+)?)\s*(kg|kilos?|g|gr|grs|gramos?|lb|libras?)/);
  if (!match) return null;
  const value = Number(match[1]);
  if (/kg|kilo/.test(match[2])) return value * 1000;
  if (/lb|libra/.test(match[2])) return value * 500;
  return value;
}

function formatWeight(grams: number): string {
  return grams >= 1000 && grams % 1000 === 0 ? `${grams / 1000} kg` : `${grams} g`;
}

function presentationFromVariant(variant: string | null | undefined, productName: string): { unit: string | null; multiplier: number } {
  const text = normalizeText(variant);
  const product = normalizeText(productName);
  if (product.includes('caja de') && product.includes('unidad')) return { unit: 'caja', multiplier: 1 };
  const kinds = ['bandeja', 'paquete', 'atado', 'bolsa', 'frasco', 'caja', 'unidad'];
  for (const kind of kinds) {
    if (text.includes(kind)) {
      const count = Number(text.match(new RegExp(`^(\\d+)\\s*${kind}`))?.[1] || 1);
      return { unit: kind, multiplier: count };
    }
  }
  return { unit: null, multiplier: 1 };
}

function canonicalVariantKey(productName: string, variant: string | null | undefined): string {
  const weight = weightFromVariant(variant);
  if (weight) return `weight:${weight}`;
  const presentation = presentationFromVariant(variant, productName);
  if (presentation.unit) return `unit:${presentation.unit}`;
  return normalizeText(variant) || 'sin-variante';
}

function mergeExportProducts(products: ExportProduct[]): ExportProduct[] {
  const merged = new Map<string, ExportProduct>();
  for (const product of products) {
    const key = `${normalizeText(product.product_name)}|${canonicalVariantKey(product.product_name, product.variant_name)}`;
    const physicalUnits = product.total_physical_units ??
      (Number(product.total_quantity || 0) * presentationFromVariant(product.variant_name, product.product_name).multiplier);
    const current = merged.get(key);
    if (!current) {
      merged.set(key, { ...product, total_physical_units: physicalUnits });
      continue;
    }
    current.total_quantity += Number(product.total_quantity || 0);
    current.total_physical_units = (current.total_physical_units || 0) + physicalUnits;
    current.customer_breakdown = [...(current.customer_breakdown || []), ...(product.customer_breakdown || [])];
  }
  return Array.from(merged.values());
}

function getQuantityLabel(p: ExportProduct): string {
  return formatPurchaseQuantity({
    productName: p.product_name,
    variantName: p.variant_name,
    totalQuantity: p.total_quantity,
    totalPhysicalUnits: p.total_physical_units,
    physicalUnitName: p.physical_unit_name,
    smallestWeightGrams: p.smallest_weight_grams,
    totalInSmallestUnits: p.total_in_smallest_units,
    totalWeightDisplay: null,
  });
}

function getProductLabel(p: ExportProduct): string {
  const variant = p.variant_name ? String(p.variant_name).trim() : '';
  return variant ? `${p.product_name} (${variant})` : p.product_name;
}

function buildCSV(products: ExportProduct[]): string {
  const BOM = '\uFEFF';
  const headers = ['Producto', 'Cantidad a comprar'];
  const rows = products.map(p => [getProductLabel(p), getQuantityLabel(p)]);
  return BOM + [headers.join(','), ...rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n');
}

function buildXLS(products: ExportProduct[]): string {
  const headers = ['Producto', 'Cantidad a comprar'];
  let rowsXml = `<Row ss:StyleID="Header">`;
  headers.forEach(h => { rowsXml += `<Cell><Data ss:Type="String">${h}</Data></Cell>`; });
  rowsXml += '</Row>';
  products.forEach(p => {
    rowsXml += '<Row>';
    [getProductLabel(p), getQuantityLabel(p)].forEach(cell => {
      const escaped = String(cell).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
      rowsXml += `<Cell><Data ss:Type="String">${escaped}</Data></Cell>`;
    });
    rowsXml += '</Row>';
  });
  return `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
 <Styles><Style ss:ID="Header"><Font ss:Bold="1" ss:Size="11"/><Interior ss:Color="#D4EDDA" ss:Pattern="Solid"/></Style></Styles>
 <Worksheet ss:Name="Lista de Compras"><Table>${rowsXml}</Table></Worksheet>
</Workbook>`;
}

function escapeHtml(value: any): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * HTML compacto para compartir: se ve completo en una sola pantalla,
 * letras ajustadas a las columnas, organización clara.
 */
function buildHTML(products: any[], dateStr: string, dateFromStr: string, dateToStr: string, combos?: any[]): string {
  const rows = products
    .map(p => `<tr>
        <td class="prod">${escapeHtml(getProductLabel(p))}</td>
        <td class="qty">${escapeHtml(getQuantityLabel(p))}</td>
      </tr>`)
    .join('\n');

  // En la exportación HTML no mostramos los combos originales:
  // la tabla ya contiene sus componentes reales de compra.
  const combosSection = '';

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Lista de Compras - Tus Aguacates</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
    background:#f5f7f5; color:#1f2937; padding:10px; font-size:12px;
  }
  .card {
    max-width:760px; margin:0 auto; background:#fff; border-radius:10px;
    overflow:hidden; box-shadow:0 1px 4px rgba(0,0,0,.08);
  }
  .head {
    background:#07180f; color:#fff; padding:10px 14px;
    display:flex; align-items:center; justify-content:space-between; gap:8px;
  }
  .head h1 { font-size:15px; font-weight:700; color:#C8A227; white-space:nowrap; }
  .head .meta { font-size:10px; color:#b8c4bd; text-align:right; line-height:1.35; }
  .head .meta b { color:#fff; }
  .combos { padding:10px 14px; border-bottom:1px solid #e5e9e5; background:#fdfaf0; }
  .combos h2 { font-size:12px; color:#C8A227; margin-bottom:6px; text-transform:uppercase; letter-spacing:.04em; }
  .combo { padding:6px 10px; border:1px solid #ece5d0; border-radius:8px; margin-bottom:6px; background:#fff; }
  .combo:last-child { margin-bottom:0; }
  .combo-head { display:flex; justify-content:space-between; align-items:center; font-size:12px; color:#07180f; }
  .combo-head span { color:#C8A227; font-weight:700; }
  .combo-desc { margin-top:3px; font-size:10px; color:#6b7280; line-height:1.4; }
  table { width:100%; border-collapse:collapse; }
  thead th {
    background:#0D2818; color:#C8A227; text-align:left; font-size:10px;
    padding:6px 8px; letter-spacing:.03em; white-space:nowrap;
  }
  tbody td { padding:5px 8px; border-bottom:1px solid #e5e9e5; vertical-align:top; font-size:11px; }
  tbody tr:nth-child(even) td { background:#f8faf8; }
  td.prod { font-weight:600; }
  td.qty { text-align:left; font-weight:700; color:#07180f; white-space:nowrap; }
  td.cust .addr { color:#9ca3af; }
  .foot {
    display:flex; justify-content:space-between; gap:8px; flex-wrap:wrap;
    background:#0D2818; color:#fff; padding:8px 14px; font-size:11px;
  }
  .foot .total { color:#C8A227; font-weight:700; }
  .actions { max-width:760px; margin:10px auto 0; display:flex; gap:8px; justify-content:center; }
  .actions button {
    font-size:12px; padding:7px 16px; border:none; border-radius:8px; cursor:pointer;
    background:#07180f; color:#C8A227; font-weight:600;
  }
  .actions button:hover { opacity:.9; }
  @media print {
    body { background:#fff; padding:0; }
    .card { box-shadow:none; border-radius:0; max-width:100%; }
    .actions { display:none; }
    thead th { -webkit-print-color-adjust:exact; print-color-adjust:exact; }
    .head, .foot, .combos, .combo { -webkit-print-color-adjust:exact; print-color-adjust:exact; }
  }
</style>
</head>
<body>
  <div class="card">
    <div class="head">
      <h1>🥑 Lista de Compras</h1>
      <div class="meta">
        <div>Tus Aguacates · ${escapeHtml(dateStr)}</div>
        <div>${dateFromStr && dateToStr ? `Pedidos: <b>${escapeHtml(dateFromStr)}</b> → <b>${escapeHtml(dateToStr)}</b>` : ''}</div>
      </div>
    </div>
    ${combosSection}
    <table>
      <thead>
        <tr>
          <th>Producto + variante</th>
          <th>Cantidad a comprar</th>
        </tr>
      </thead>
      <tbody>
${rows}
      </tbody>
    </table>
    <div class="foot">
      <span>Productos: <b>${products.length}</b></span>
    </div>
  </div>
  <div class="actions">
    <button onclick="window.print()">🖨 Imprimir</button>
    <button onclick="window.close()">Cerrar</button>
  </div>
</body>
</html>`;
}

function buildPDF(products: any[], dateStr: string, dateFromStr: string, dateToStr: string): Buffer {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  doc.setFontSize(16);
  doc.setTextColor(22, 101, 52);
  doc.setFont('helvetica', 'bold');
  doc.text('Lista de Compras - Tus Aguacates', 14, 16);

  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generada: ${dateStr}`, 14, 22);
  if (dateFromStr && dateToStr) {
    doc.text(`Pedidos del: ${dateFromStr} al ${dateToStr}`, 14, 26);
  }

  const bodyRows = products.map(p => [getProductLabel(p), getQuantityLabel(p)]);

  autoTable(doc, {
    startY: 32,
    head: [['Producto + variante', 'Cantidad a comprar']],
    body: bodyRows,
    theme: 'grid',
    headStyles: { fillColor: [22, 101, 52], fontSize: 9 },
    bodyStyles: { fontSize: 8 },
    styles: { cellPadding: 1.5 },
    columnStyles: {
      0: { cellWidth: 130 },
      1: { cellWidth: 75 },
    },
  });

  return Buffer.from(doc.output('arraybuffer'));
}

/**
 * Función central: genera el archivo a partir de productos.
 * Los productos vienen con purchase_text (presentación completa calculada en la página)
 * o se calculan server-side como fallback.
 */
async function handleExport(request: NextRequest, isPost: boolean) {
  try {
    const auth = await verifyAdminAuth(request);
    if (!auth.success) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    let dateFrom = '';
    let dateTo = '';
    let routeDate = '';
    let format = 'pdf';
    let products: any[] = [];
    let productsProvided = false;
    let combos: any[] = [];

    if (isPost) {
      const formData = await request.formData();
      dateFrom = String(formData.get('dateFrom') || '');
      dateTo = String(formData.get('dateTo') || '');
      routeDate = String(formData.get('routeDate') || '');
      format = String(formData.get('format') || 'pdf').toLowerCase();
      const productsRaw = formData.get('products');
      if (productsRaw) {
        try {
          products = JSON.parse(String(productsRaw));
          productsProvided = Array.isArray(products) && products.length > 0;
        } catch (e) {
          return NextResponse.json({ error: 'Datos de productos inválidos' }, { status: 400 });
        }
      }
      const combosRaw = formData.get('combos');
      if (combosRaw) {
        try {
          combos = JSON.parse(String(combosRaw));
        } catch (e) {
          combos = [];
        }
      }
    } else {
      const url = new URL(request.url);
      dateFrom = url.searchParams.get('dateFrom') || '';
      dateTo = url.searchParams.get('dateTo') || '';
      routeDate = url.searchParams.get('routeDate') || '';
      format = (url.searchParams.get('format') || 'pdf').toLowerCase();
      // Datos procesados compactos (base64url) enviados por la página
      const dataParam = url.searchParams.get('data');
      if (dataParam) {
        try {
          // Revertir base64url → base64
          const base64 = String(dataParam).replace(/-/g, '+').replace(/_/g, '/');
          const json = Buffer.from(base64, 'base64').toString('utf8');
          const parsed = JSON.parse(json);
          if (Array.isArray(parsed.products)) {
            // Normalizar payload compacto (claves cortas) al formato interno
            products = parsed.products.map((p: any) => ({
              product_name: p.n || p.product_name || 'Producto',
              variant_name: p.v || p.variant_name || null,
              purchase_text: p.q || p.purchase_text || null,
              total_quantity: p.t ?? p.total_quantity ?? 0,
              total_physical_units: p.f ?? p.total_physical_units,
              physical_unit_name: p.u ?? p.physical_unit_name ?? null,
              smallest_weight_grams: p.w ?? p.smallest_weight_grams,
              total_in_smallest_units: p.s ?? p.total_in_smallest_units,
              unit_price: p.p ?? p.unit_price ?? 0,
              customer_breakdown: (p.c || p.customer_breakdown || []).map((c: any) => ({
                customer_name: c.n || c.customer_name || 'Cliente',
                customer_address: c.a || c.customer_address || '',
              })),
            }));
          }
          if (Array.isArray(parsed.combos)) {
            combos = parsed.combos.map((c: any) => ({
              name: c.n || c.name || 'Combo',
              quantity: c.q ?? c.quantity ?? 1,
              description: c.d || c.description || '',
            }));
          }
        } catch (e) {
          console.error('⚠️ Export API: error decodificando data:', e);
        }
      }
    }

    if (!dateFrom || !dateTo) {
      return NextResponse.json({ error: 'Se requieren dateFrom y dateTo' }, { status: 400 });
    }

    // Si no llegaron productos procesados (GET o POST sin products), calcular server-side
    if (!products || products.length === 0) {
      const supabase = createSupabaseClient();

      // Rango en UTC (fechas locales Bogotá -05:00)
      const fromDate = new Date(`${dateFrom}T00:00:00-05:00`).toISOString();
      const toDate = new Date(`${dateTo}T23:59:59-05:00`).toISOString();

      const ordersQuery = supabase.from('orders').select('*');
      const guestsQuery = supabase.from('guest_orders').select('*');
      if (!routeDate) {
        ordersQuery.gte('created_at', fromDate).lte('created_at', toDate);
        guestsQuery.gte('created_at', fromDate).lte('created_at', toDate);
      }
      const [ordersResult, guestsResult] = await Promise.all([
        ordersQuery,
        guestsQuery,
      ]);

      if (ordersResult.error) {
        console.error('❌ Export API: error orders:', ordersResult.error);
        return NextResponse.json({ error: 'Error consultando pedidos' }, { status: 500 });
      }
      if (guestsResult.error) {
        console.error('❌ Export API: error guest_orders:', guestsResult.error);
        return NextResponse.json({ error: 'Error consultando pedidos invitados' }, { status: 500 });
      }

      const allOrders = [...(ordersResult.data || []), ...(guestsResult.data || [])].filter(
        (o: any) => isRouteEligible(o) || (!routeDate && !['cancelled', 'cancelado'].includes(o.status || o.order_status || ''))
      ).filter((o: any) => !routeDate || (isRouteEligible(o) && deliveryDateOf(o) === routeDate));

      const items: ExportItem[] = [];
      allOrders.forEach(o => {
        let orderData = o.order_data;
        if (typeof orderData === 'string') {
          try { orderData = JSON.parse(orderData); } catch { orderData = null; }
        }
        items.push(...extractOrderItems({ ...o, order_data: orderData }));
      });

      products = groupProducts(items);
    }

    products = productsProvided ? products as ExportProduct[] : mergeExportProducts(products as ExportProduct[]);

    if (products.length === 0) {
      return NextResponse.json({ error: 'No hay productos en el rango seleccionado' }, { status: 400 });
    }

    const dateStr = new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });
    const dateFromStr = new Date(`${dateFrom}T00:00:00-05:00`).toLocaleDateString('es-CO');
    const dateToStr = new Date(`${dateTo}T00:00:00-05:00`).toLocaleDateString('es-CO');
    const fileDate = new Date().toISOString().split('T')[0];

    if (format === 'csv') {
      const csv = buildCSV(products);
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="lista-compras-${fileDate}.csv"`,
        },
      });
    }

    if (format === 'xls') {
      const xls = buildXLS(products);
      return new NextResponse(xls, {
        headers: {
          'Content-Type': 'application/vnd.ms-excel; charset=utf-8',
          'Content-Disposition': `attachment; filename="lista-compras-${fileDate}.xls"`,
        },
      });
    }

    if (format === 'html') {
      const html = buildHTML(products, dateStr, dateFromStr, dateToStr, combos);
      return new NextResponse(html, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Content-Disposition': `attachment; filename="lista-compras-${fileDate}.html"`,
        },
      });
    }

    // PDF (default)
    const pdfBuffer = buildPDF(products, dateStr, dateFromStr, dateToStr);
    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="lista-compras-${fileDate}.pdf"`,
        'Content-Length': String(pdfBuffer.length),
      },
    });
  } catch (error) {
    console.error('❌ Export API error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return handleExport(request, false);
}

export async function POST(request: NextRequest) {
  return handleExport(request, true);
}
