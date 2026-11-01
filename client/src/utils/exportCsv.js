function escapeCsvCell(val) {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function exportOrdersToCsv(orders = []) {
  const headers = [
    'Order ID',
    'Customer Name',
    'Phone',
    'Delivery Address',
    'Weight (kg)',
    'Volume (m3)',
    'Status',
    'Created At',
  ];

  const rows = orders.map((order) => [
    escapeCsvCell(order.id),
    escapeCsvCell(order.customerName),
    escapeCsvCell(order.customerPhone),
    escapeCsvCell(order.deliveryAddress),
    escapeCsvCell(order.weightKg),
    escapeCsvCell(order.volumeM3),
    escapeCsvCell(order.status),
    escapeCsvCell(order.createdAt ? new Date(order.createdAt).toISOString() : ''),
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map((r) => r.join(',')),
  ].join('\r\n');

  const today = new Date().toISOString().split('T')[0];
  const filename = `orders_export_${today}.csv`;
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportVehiclesToCsv(vehicles = []) {
  const headers = [
    'Vehicle ID',
    'Brand',
    'License Plate',
    'Capacity (kg)',
    'Volume (m3)',
    'Status',
    'Assigned Driver Name',
    'Assigned Driver Phone',
  ];

  const rows = vehicles.map((vehicle) => {
    const driver = vehicle.currentDriver;
    const driverName = driver?.fullName ? driver.fullName : 'Unassigned';
    const driverPhone = driver?.phone ? driver.phone : 'Unassigned';

    return [
      escapeCsvCell(vehicle.id),
      escapeCsvCell(vehicle.brand),
      escapeCsvCell(vehicle.licensePlate),
      escapeCsvCell(vehicle.capacityKg),
      escapeCsvCell(vehicle.volumeM3),
      escapeCsvCell(vehicle.status),
      escapeCsvCell(driverName),
      escapeCsvCell(driverPhone),
    ];
  });

  const csvContent = [
    headers.join(','),
    ...rows.map((r) => r.join(',')),
  ].join('\r\n');

  const today = new Date().toISOString().split('T')[0];
  const filename = `vehicles_export_${today}.csv`;
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
