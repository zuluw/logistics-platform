function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function printWaybill(route) {
  if (!route) return;

  const routeId = route.id || 'N/A';
  const rawDate = route.routeDate || route.createdAt || new Date();
  const routeDate = new Date(rawDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  const vehicleBrand = route.vehicle?.brand || 'N/A';
  const vehiclePlate = route.vehicle?.licensePlate || 'N/A';
  const vehicleText = `${vehicleBrand} (${vehiclePlate})`;

  const driverName = route.driver?.fullName || 'Unassigned';
  const driverPhone = route.driver?.phone || 'N/A';

  const totalDistance = Number(route.totalDistanceKm ?? route.distanceKm ?? 0).toFixed(1);
  const totalDuration = route.totalDurationMin ?? route.durationMin ?? 0;

  let stops = [];
  if (Array.isArray(route.routePoints) && route.routePoints.length > 0) {
    stops = route.routePoints.map((pt, idx) => ({
      sequence: pt.stopSequence || idx + 1,
      address: pt.order?.deliveryAddress || 'N/A',
      customer: `${pt.order?.customerName || 'N/A'}${pt.order?.customerPhone ? ' (' + pt.order.customerPhone + ')' : ''}`,
      cargo: `${pt.order?.weightKg ?? 0} kg / ${pt.order?.volumeM3 ?? 0} m³`,
    }));
  } else if (Array.isArray(route.orderedOrders) && route.orderedOrders.length > 0) {
    stops = route.orderedOrders.map((order, idx) => ({
      sequence: idx + 1,
      address: order.deliveryAddress || 'N/A',
      customer: `${order.customerName || 'N/A'}${order.customerPhone ? ' (' + order.customerPhone + ')' : ''}`,
      cargo: `${order.weightKg ?? 0} kg / ${order.volumeM3 ?? 0} m³`,
    }));
  }

  const stopsRows = stops
    .map(
      (s) => `
    <tr>
      <td class="text-center font-bold">#${s.sequence}</td>
      <td>${escapeHtml(s.address)}</td>
      <td>${escapeHtml(s.customer)}</td>
      <td>${escapeHtml(s.cargo)}</td>
      <td class="write-box"></td>
      <td class="write-box"></td>
    </tr>`
    )
    .join('');

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Waybill - ${escapeHtml(routeId)}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm 15mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #000;
      background: #fff;
      font-size: 11px;
      line-height: 1.4;
      padding: 12px;
    }
    .header {
      text-align: center;
      border-bottom: 2px solid #000;
      padding-bottom: 10px;
      margin-bottom: 12px;
    }
    .header h1 {
      font-size: 15px;
      font-weight: 800;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      margin-bottom: 3px;
    }
    .header p {
      font-size: 10px;
      color: #333;
    }
    .metadata-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6px 16px;
      border: 1px solid #000;
      padding: 8px 12px;
      margin-bottom: 14px;
      font-size: 11px;
    }
    .meta-row {
      display: flex;
    }
    .meta-label {
      font-weight: 700;
      width: 145px;
      flex-shrink: 0;
    }
    .meta-value {
      flex: 1;
    }
    table.stops-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
      font-size: 10.5px;
    }
    table.stops-table th,
    table.stops-table td {
      border: 1px solid #000;
      padding: 6px 8px;
      vertical-align: middle;
    }
    table.stops-table th {
      background-color: #f2f2f2;
      font-weight: 700;
      text-align: left;
      font-size: 10px;
      text-transform: uppercase;
    }
    .text-center {
      text-align: center !important;
    }
    .font-bold {
      font-weight: 700;
    }
    .write-box {
      min-width: 85px;
      height: 28px;
    }
    .signature-section {
      margin-top: 32px;
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      font-weight: 600;
      padding: 0 8px;
    }
    .signature-box {
      width: 44%;
    }
    .signature-title {
      margin-bottom: 28px;
    }
    .signature-line {
      border-bottom: 1px solid #000;
    }
    @media print {
      body {
        padding: 0;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      table.stops-table {
        page-break-inside: auto;
      }
      tr {
        page-break-inside: avoid;
        page-break-after: auto;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>COMMERCIAL ROUTE WAYBILL</h1>
    <p>Automated Logistics Management Platform &bull; Delivery Control System</p>
  </div>

  <div class="metadata-grid">
    <div class="meta-row">
      <span class="meta-label">Route ID:</span>
      <span class="meta-value font-bold">${escapeHtml(routeId)}</span>
    </div>
    <div class="meta-row">
      <span class="meta-label">Date:</span>
      <span class="meta-value">${escapeHtml(routeDate)}</span>
    </div>
    <div class="meta-row">
      <span class="meta-label">Vehicle:</span>
      <span class="meta-value">${escapeHtml(vehicleText)}</span>
    </div>
    <div class="meta-row">
      <span class="meta-label">Assigned Driver:</span>
      <span class="meta-value">${escapeHtml(driverName)} (Phone: ${escapeHtml(driverPhone)})</span>
    </div>
    <div class="meta-row">
      <span class="meta-label">Total Distance:</span>
      <span class="meta-value">${totalDistance} km</span>
    </div>
    <div class="meta-row">
      <span class="meta-label">Estimated Transit Time:</span>
      <span class="meta-value">${totalDuration} min</span>
    </div>
  </div>

  <table class="stops-table">
    <thead>
      <tr>
        <th class="text-center" style="width: 8%;">Stop Seq</th>
        <th style="width: 32%;">Delivery Address</th>
        <th style="width: 24%;">Customer Name and Phone</th>
        <th style="width: 16%;">Cargo Weight / Vol</th>
        <th style="width: 10%;">Arrival Time</th>
        <th style="width: 10%;">Client Signature</th>
      </tr>
    </thead>
    <tbody>
      ${stopsRows || '<tr><td colspan="6" class="text-center" style="padding: 12px;">No delivery stops recorded</td></tr>'}
    </tbody>
  </table>

  <div class="signature-section">
    <div class="signature-box">
      <div class="signature-title">Dispatcher Signature: _________________________</div>
      <div class="signature-line"></div>
    </div>
    <div class="signature-box">
      <div class="signature-title">Driver Signature: _________________________</div>
      <div class="signature-line"></div>
    </div>
  </div>
</body>
</html>`;

  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.style.visibility = 'hidden';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow.document;
  doc.open();
  doc.write(html);
  doc.close();

  iframe.contentWindow.focus();
  setTimeout(() => {
    iframe.contentWindow.print();
    setTimeout(() => {
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
    }, 1500);
  }, 300);
}
