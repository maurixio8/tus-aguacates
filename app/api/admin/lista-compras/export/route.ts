import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient, verifyAdminAuth } from '@/lib/auth-admin';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

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

/**
 * Texto de cantidad a comprar:
 * - Usa purchase_text (presentación completa calculada en la página: gramos, kilos, bandejas, etc.)
 * - Fallback: texto simplificado con total_quantity y variante
 */
function getQuantityLabel(p: any): string {
  if (p.purchase_text) return String(p.purchase_text);
  if (p.total_physical_units && p.physical_unit_name) {
    const plural = p.total_physical_units === 1 ? p.physical_unit_name : `${p.physical_unit_name}s`;
    return `${p.total_physical_units} ${plural}`;
  }
  return `${p.total_quantity} ${p.variant_name || 'unidad'}`;
}

function buildCSV(products: any[]): string {
  const BOM = '\uFEFF';
  const headers = ['Producto', 'Cantidad a comprar', 'Precio Unitario', 'Costo Total', 'Clientes', 'Direcciones'];
  const rows: string[][] = [];

  products.forEach(p => {
    const customerNames = p.customer_breakdown.map((c: any) => c.customer_name).join('; ');
    const addresses = p.customer_breakdown.map((c: any) => c.customer_address || 'N/A').join('; ');
    const totalCost = p.unit_price * p.total_quantity;

    rows.push([
      p.product_name,
      getQuantityLabel(p),
      p.unit_price > 0 ? formatCOP(p.unit_price) : '-',
      totalCost > 0 ? formatCOP(totalCost) : '-',
      customerNames,
      addresses,
    ]);

    p.customer_breakdown.forEach((c: any) => {
      rows.push(['', '', '', '', c.customer_name, c.customer_address || '-']);
    });
  });

  return BOM + [headers.join(','), ...rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n');
}

function buildXLS(products: any[]): string {
  const headers = ['Producto', 'Cantidad a comprar', 'Precio Unitario', 'Costo Total', 'Clientes', 'Direcciones'];
  let rowsXml = `<Row ss:StyleID="Header">`;
  headers.forEach(h => {
    rowsXml += `<Cell><Data ss:Type="String">${h}</Data></Cell>`;
  });
  rowsXml += '</Row>';

  products.forEach(p => {
    const customerNames = p.customer_breakdown.map((c: any) => c.customer_name).join('; ');
    const addresses = p.customer_breakdown.map((c: any) => c.customer_address || 'N/A').join('; ');
    const totalCost = p.unit_price * p.total_quantity;
    const cells = [
      p.product_name,
      getQuantityLabel(p),
      p.unit_price > 0 ? formatCOP(p.unit_price) : '-',
      totalCost > 0 ? formatCOP(totalCost) : '-',
      customerNames,
      addresses,
    ];
    rowsXml += '<Row>';
    cells.forEach(cell => {
      const escaped = String(cell).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
      rowsXml += `<Cell><Data ss:Type="String">${escaped}</Data></Cell>`;
    });
    rowsXml += '</Row>';
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel">
 <Styles>
  <Style ss:ID="Header">
   <Font ss:Bold="1" ss:Size="11"/>
   <Interior ss:Color="#D4EDDA" ss:Pattern="Solid"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="Lista de Compras">
  <Table>
${rowsXml}
  </Table>
 </Worksheet>
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
  const totalUnits = products.reduce((s, p) => s + p.total_quantity, 0);
  const totalValue = products.reduce((s, p) => s + p.unit_price * p.total_quantity, 0);

  const rows = products
    .map(p => {
      const totalCost = p.unit_price * p.total_quantity;
      const customers = p.customer_breakdown
        .map((c: any) => `${escapeHtml(c.customer_name)}${c.customer_address ? ` <span class="addr">· ${escapeHtml(c.customer_address)}</span>` : ''}`)
        .join('<br>');
      return `<tr>
        <td class="prod">${escapeHtml(p.product_name)}${p.variant_name ? `<span class="variant"> · ${escapeHtml(p.variant_name)}</span>` : ''}</td>
        <td class="qty">${escapeHtml(getQuantityLabel(p))}</td>
        <td class="num">${p.unit_price > 0 ? formatCOP(p.unit_price) : '-'}</td>
        <td class="num">${totalCost > 0 ? formatCOP(totalCost) : '-'}</td>
        <td class="cust">${customers}</td>
      </tr>`;
    })
    .join('\n');

  // Sección de combos con descripción de qué trae cada uno
  const combosSection = combos && combos.length > 0
    ? `<div class="combos">
  <h2>🎁 Combos</h2>
  ${combos.map(c => `
  <div class="combo">
    <div class="combo-head">
      <b>${escapeHtml(c.name)}</b>
      <span>× ${c.quantity}</span>
    </div>
    ${c.description ? `<div class="combo-desc">${escapeHtml(c.description)}</div>` : ''}
  </div>`).join('\n')}
</div>`
    : '';

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
  td.prod { font-weight:600; white-space:nowrap; }
  td.prod .variant { font-weight:400; color:#6b7280; font-size:10px; }
  td.qty { text-align:center; font-weight:700; color:#07180f; white-space:nowrap; }
  td.num { text-align:right; font-variant-numeric:tabular-nums; white-space:nowrap; }
  td.cust { color:#374151; line-height:1.3; font-size:10px; }
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
          <th>Producto</th>
          <th style="text-align:center">Cant. a comprar</th>
          <th style="text-align:right">P. Unit</th>
          <th style="text-align:right">Total</th>
          <th>Clientes</th>
        </tr>
      </thead>
      <tbody>
${rows}
      </tbody>
    </table>
    <div class="foot">
      <span>Productos: <b>${products.length}</b></span>
      <span>Unidades: <b>${totalUnits}</b></span>
      <span class="total">Valor estimado: ${formatCOP(totalValue)}</span>
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

  const bodyRows = products.map(p => {
    const totalCost = p.unit_price * p.total_quantity;
    return [
      p.product_name,
      getQuantityLabel(p),
      p.unit_price > 0 ? formatCOP(p.unit_price) : '-',
      totalCost > 0 ? formatCOP(totalCost) : '-',
    ];
  });

  autoTable(doc, {
    startY: 32,
    head: [['Producto', 'Cantidad a comprar', 'Precio Unit.', 'Costo Total']],
    body: bodyRows,
    theme: 'grid',
    headStyles: { fillColor: [22, 101, 52], fontSize: 9 },
    bodyStyles: { fontSize: 8 },
    styles: { cellPadding: 1.5 },
    columnStyles: {
      0: { cellWidth: 130 },
      1: { cellWidth: 55 },
      2: { cellWidth: 30 },
      3: { cellWidth: 30 },
    },
  });

  const finalY = (doc as any).lastAutoTable?.finalY || 40;
  doc.setFontSize(10);
  doc.setTextColor(22, 101, 52);
  doc.setFont('helvetica', 'bold');
  doc.text(`Total de productos: ${products.length}`, 14, finalY + 8);
  const totalUnits = products.reduce((s, p) => s + p.total_quantity, 0);
  doc.text(`Total de unidades: ${totalUnits}`, 14, finalY + 13);

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
    let format = 'pdf';
    let products: any[] = [];
    let combos: any[] = [];

    if (isPost) {
      const formData = await request.formData();
      dateFrom = String(formData.get('dateFrom') || '');
      dateTo = String(formData.get('dateTo') || '');
      format = String(formData.get('format') || 'pdf').toLowerCase();
      const productsRaw = formData.get('products');
      if (productsRaw) {
        try {
          products = JSON.parse(String(productsRaw));
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
      format = (url.searchParams.get('format') || 'pdf').toLowerCase();
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

      const [ordersResult, guestsResult] = await Promise.all([
        supabase
          .from('orders')
          .select('*')
          .gte('created_at', fromDate)
          .lte('created_at', toDate),
        supabase
          .from('guest_orders')
          .select('*')
          .gte('created_at', fromDate)
          .lte('created_at', toDate),
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
        (o: any) => !['cancelled', 'cancelado'].includes(o.status || o.order_status || '')
      );

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
