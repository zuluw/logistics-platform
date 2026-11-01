import { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import { useSocket } from '../../context/SocketContext.jsx';

const MINSK_CENTER = [53.8961, 27.5503];

function getStatusColor(status) {
  switch (status) {
    case 'DELIVERED':
      return '#10b981';
    case 'IN_TRANSIT':
      return '#f97316';
    case 'CANCELLED':
      return '#6b7280';
    case 'ASSIGNED':
      return '#8b5cf6';
    case 'PENDING':
    default:
      return '#2563eb';
  }
}

function createWarehouseIcon() {
  return L.divIcon({
    className: 'custom-warehouse-marker',
    html: `
      <div style="background-color: #0f172a; color: white; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 8px rgba(0,0,0,0.35); border: 2.5px solid #ffffff;">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -20],
  });
}

function createOrderIcon(status, isSelected, sequenceNumber) {
  const color = getStatusColor(status);
  const selectedBorder = isSelected ? 'border: 3px solid #facc15; transform: scale(1.15);' : 'border: 2px solid #ffffff;';
  const content = sequenceNumber !== undefined
    ? `<span style="font-size: 11px; font-weight: 700;">${sequenceNumber}</span>`
    : `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`;

  return L.divIcon({
    className: 'custom-order-marker',
    html: `
      <div style="background-color: ${color}; color: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 3px 6px rgba(0,0,0,0.3); transition: transform 0.15s ease; ${selectedBorder}">
        ${content}
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -16],
  });
}

function createDriverIcon(heading = 0) {
  return L.divIcon({
    className: 'custom-driver-live-marker',
    html: `
      <div style="position: relative; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;">
        <span style="position: absolute; width: 36px; height: 36px; border-radius: 50%; background-color: rgba(37, 99, 235, 0.35); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>
        <div style="position: relative; width: 32px; height: 32px; border-radius: 50%; background-color: #2563eb; color: #ffffff; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(37, 99, 235, 0.5); border: 2.5px solid #ffffff; transform: rotate(${heading}deg); transition: transform 0.25s ease;">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="12 2 19 21 12 17 5 21 12 2"/>
          </svg>
        </div>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20],
  });
}

export function InteractiveMap({
  orders = [],
  routes = [],
  activeRoutes = null,
  previewRoute = null,
  warehouse = { latitude: 53.8961, longitude: 27.5503, name: 'Central Warehouse / Depot' },
  selectedOrderIds = [],
  onMapClick,
  className = '',
  focusRoute = null,
  driverLocation = null,
  centerCoords = null,
  recenterTrigger = 0,
  followDriver = false,
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);
  const routesLayerRef = useRef(null);
  const previewLayerRef = useRef(null);
  const driversLayerRef = useRef(null);
  const hasFittedRouteRef = useRef(false);

  const { socket } = useSocket();
  const [socketDriverLocations, setSocketDriverLocations] = useState(new Map());

  useEffect(() => {
    if (!socket) return;

    const handleLocationChanged = (data) => {
      if (!data?.driverId || !data.latitude || !data.longitude) return;
      setSocketDriverLocations((prev) => {
        const next = new Map(prev);
        next.set(data.driverId, data);
        return next;
      });
    };

    socket.on('driver:location_changed', handleLocationChanged);
    return () => {
      socket.off('driver:location_changed', handleLocationChanged);
    };
  }, [socket]);

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: MINSK_CENTER,
      zoom: 12,
      zoomControl: true,
      attributionControl: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      subdomains: ['a', 'b', 'c'],
      updateWhenIdle: false,
      updateWhenZooming: false,
      keepBuffer: 8,
    }).addTo(map);

    const routesLayer = L.layerGroup().addTo(map);
    const previewLayer = L.layerGroup().addTo(map);
    const markersLayer = L.layerGroup().addTo(map);
    const driversLayer = L.layerGroup().addTo(map);

    routesLayerRef.current = routesLayer;
    previewLayerRef.current = previewLayer;
    markersLayerRef.current = markersLayer;
    driversLayerRef.current = driversLayer;
    mapInstanceRef.current = map;

    map.on('click', (e) => {
      onMapClick?.({
        lat: Number(e.latlng.lat.toFixed(6)),
        lng: Number(e.latlng.lng.toFixed(6)),
      });
    });

    const handleResize = () => {
      map.invalidateSize();
    };
    window.addEventListener('resize', handleResize);

    const invalidateTimer = setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      clearTimeout(invalidateTimer);
      window.removeEventListener('resize', handleResize);
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [onMapClick]);

  useEffect(() => {
    const markersLayer = markersLayerRef.current;
    if (!markersLayer) return;

    markersLayer.clearLayers();

    if (warehouse?.latitude && warehouse?.longitude) {
      const warehouseMarker = L.marker([warehouse.latitude, warehouse.longitude], {
        icon: createWarehouseIcon(),
        title: warehouse.name,
      });

      warehouseMarker.bindPopup(`
        <div style="font-family: inherit; font-size: 13px; line-height: 1.4;">
          <div style="font-weight: 700; color: #0f172a; margin-bottom: 2px;">${warehouse.name}</div>
          <div style="color: #64748b; font-size: 11px;">Depot & Distribution Point</div>
          <div style="color: #475569; font-size: 11px; margin-top: 4px;">Lat: ${warehouse.latitude}, Lng: ${warehouse.longitude}</div>
        </div>
      `);

      markersLayer.addLayer(warehouseMarker);
    }

    const previewOrderSequenceMap = new Map();
    if (previewRoute?.orderedOrders) {
      previewRoute.orderedOrders.forEach((order, index) => {
        previewOrderSequenceMap.set(order.id, index + 1);
      });
    }

    orders.forEach((order) => {
      if (!order.latitude || !order.longitude) return;

      const isSelected = selectedOrderIds.includes(order.id);
      const sequenceNumber = previewOrderSequenceMap.get(order.id);
      const icon = createOrderIcon(order.status, isSelected, sequenceNumber);

      const marker = L.marker([order.latitude, order.longitude], {
        icon,
        title: order.customerName,
      });

      const popupContent = `
        <div style="font-family: inherit; font-size: 12px; line-height: 1.4; min-width: 180px;">
          <div style="font-weight: 700; font-size: 13px; color: #0f172a;">${order.customerName}</div>
          <div style="color: #334155; margin-top: 3px;"><strong>Address:</strong> ${order.deliveryAddress}</div>
          <div style="color: #334155; margin-top: 2px;"><strong>Phone:</strong> ${order.customerPhone}</div>
          <div style="color: #334155; margin-top: 2px;"><strong>Weight:</strong> ${order.weightKg} kg | <strong>Vol:</strong> ${order.volumeM3} m³</div>
          <div style="margin-top: 6px; display: inline-block; padding: 2px 8px; border-radius: 9999px; font-weight: 600; font-size: 10px; background-color: ${getStatusColor(order.status)}18; color: ${getStatusColor(order.status)};">
            ${order.status}
          </div>
        </div>
      `;

      marker.bindPopup(popupContent);
      markersLayer.addLayer(marker);
    });
  }, [orders, warehouse, selectedOrderIds, previewRoute]);

  const displayRoutes = useMemo(() => {
    if (activeRoutes && Array.isArray(activeRoutes)) {
      return activeRoutes;
    }
    return routes || [];
  }, [activeRoutes, routes]);

  useEffect(() => {
    const routesLayer = routesLayerRef.current;
    if (!routesLayer) return;

    routesLayer.clearLayers();

    let combinedBounds = null;

    displayRoutes.forEach((route) => {
      if (!route?.polylineGeometry) return;

      try {
        const geojson = typeof route.polylineGeometry === 'string'
          ? JSON.parse(route.polylineGeometry)
          : route.polylineGeometry;

        const lineColor = route.color || '#2563eb';

        const line = L.geoJSON(geojson, {
          style: {
            color: lineColor,
            weight: 4,
            opacity: 0.85,
            lineCap: 'round',
            lineJoin: 'round',
          },
        });

        const driverName = route.driver?.fullName || 'Unassigned';
        const vehiclePlate = route.vehicle?.licensePlate ? `(${route.vehicle.licensePlate})` : '';

        line.bindPopup(`
          <div style="font-family: inherit; font-size: 12px; line-height: 1.4;">
            <div style="font-weight: 700; color: #1e293b;">${route.vehicle?.brand || 'Active Route'} ${vehiclePlate}</div>
            <div style="color: #475569; margin-top: 2px;">Driver: <strong>${driverName}</strong></div>
            <div style="color: #475569;">Distance: ${route.totalDistanceKm} km | Duration: ${route.totalDurationMin} min</div>
            <div style="color: #475569;">Status: ${route.status}</div>
          </div>
        `);

        routesLayer.addLayer(line);

        const bounds = line.getBounds();
        if (bounds.isValid()) {
          combinedBounds = combinedBounds ? combinedBounds.extend(bounds) : bounds;
        }
      } catch {}
    });

    if (!hasFittedRouteRef.current && combinedBounds && combinedBounds.isValid() && mapInstanceRef.current) {
      mapInstanceRef.current.fitBounds(combinedBounds, { padding: [40, 40] });
      hasFittedRouteRef.current = true;
    }
  }, [displayRoutes]);

  useEffect(() => {
    const driversLayer = driversLayerRef.current;
    if (!driversLayer) return;

    driversLayer.clearLayers();

    const driversToRender = [];

    if (driverLocation?.latitude && driverLocation?.longitude) {
      driversToRender.push({
        id: 'local-driver',
        label: 'My Vehicle (Live GPS)',
        latitude: driverLocation.latitude,
        longitude: driverLocation.longitude,
        heading: driverLocation.heading || 0,
        speed: driverLocation.speed,
      });
    }

    socketDriverLocations.forEach((data) => {
      if (driverLocation && data.driverId === driverLocation.driverId) return;
      driversToRender.push({
        id: data.driverId,
        label: `Driver (${data.driverId.slice(0, 6)})`,
        latitude: data.latitude,
        longitude: data.longitude,
        heading: data.heading || 0,
        speed: data.speed,
      });
    });

    driversToRender.forEach((d) => {
      const marker = L.marker([d.latitude, d.longitude], {
        icon: createDriverIcon(d.heading),
        zIndexOffset: 1000,
        title: d.label,
      });

      marker.bindPopup(`
        <div style="font-family: inherit; font-size: 12px; line-height: 1.4;">
          <div style="font-weight: 700; color: #1e293b;">${d.label}</div>
          <div style="color: #2563eb; font-weight: 600; margin-top: 2px;">Live GPS Tracking</div>
          ${d.speed !== undefined ? `<div style="color: #64748b;">Speed: ${Math.round(d.speed)} km/h</div>` : ''}
          <div style="color: #64748b; font-size: 11px;">Lat: ${d.latitude.toFixed(5)}, Lng: ${d.longitude.toFixed(5)}</div>
        </div>
      `);

      driversLayer.addLayer(marker);
    });
  }, [driverLocation, socketDriverLocations]);

  useEffect(() => {
    const previewLayer = previewLayerRef.current;
    const map = mapInstanceRef.current;
    if (!previewLayer) return;

    previewLayer.clearLayers();

    if (previewRoute?.geometry) {
      try {
        const geojson = typeof previewRoute.geometry === 'string'
          ? JSON.parse(previewRoute.geometry)
          : previewRoute.geometry;

        const line = L.geoJSON(geojson, {
          style: {
            color: '#7c3aed',
            weight: 5,
            opacity: 0.9,
            dashArray: '8, 8',
            lineCap: 'round',
            lineJoin: 'round',
          },
        });

        line.bindPopup(`
          <div style="font-family: inherit; font-size: 12px;">
            <div style="font-weight: 700; color: #7c3aed;">Optimized Route Preview</div>
            <div style="color: #475569; margin-top: 2px;">Distance: ${previewRoute.distanceKm} km</div>
            <div style="color: #475569;">Duration: ${previewRoute.durationMin} min</div>
          </div>
        `);

        previewLayer.addLayer(line);

        if (map) {
          const bounds = line.getBounds();
          if (bounds.isValid()) {
            map.fitBounds(bounds, { padding: [40, 40] });
          }
        }
      } catch {}
    }
  }, [previewRoute]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !focusRoute?.polylineGeometry) return;

    try {
      const geojson = typeof focusRoute.polylineGeometry === 'string'
        ? JSON.parse(focusRoute.polylineGeometry)
        : focusRoute.polylineGeometry;

      const line = L.geoJSON(geojson);
      const bounds = line.getBounds();
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
      }
    } catch {}
  }, [focusRoute]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !centerCoords || recenterTrigger === 0) return;
    if (centerCoords.latitude && centerCoords.longitude) {
      map.setView([centerCoords.latitude, centerCoords.longitude], 15, { animate: true });
    } else if (Array.isArray(centerCoords) && centerCoords.length === 2) {
      map.setView(centerCoords, 15, { animate: true });
    }
  }, [recenterTrigger]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !followDriver || !driverLocation?.latitude || !driverLocation?.longitude) return;
    map.panTo([driverLocation.latitude, driverLocation.longitude], { animate: true, duration: 0.8 });
  }, [driverLocation, followDriver]);

  return (
    <div
      ref={mapContainerRef}
      className={`w-full h-full min-h-[300px] z-0 ${className}`}
    />
  );
}

export default InteractiveMap;
