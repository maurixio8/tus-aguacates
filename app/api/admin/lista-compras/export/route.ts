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
      `${p.total_quantity} ${p.variant_name || 'unidad'}`,
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
      `${p.total_quantity} ${p.variant_name || 'unidad'}`,
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
      `${p.total_quantity} ${p.variant_name || 'unidad'}`,
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

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAdminAuth(request);
    if (!auth.success) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const url = new URL(request.url);
    const dateFrom = url.searchParams.get('dateFrom') || '';
    const dateTo = url.searchParams.get('dateTo') || '';
    const format = (url.searchParams.get('format') || 'pdf').toLowerCase();

    if (!dateFrom || !dateTo) {
      return NextResponse.json({ error: 'Se requieren dateFrom y dateTo' }, { status: 400 });
    }

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

    const products = groupProducts(items);
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
