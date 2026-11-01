import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useSocket } from '../../context/SocketContext.jsx';
import { useLogistics } from '../../context/LogisticsContext.jsx';
import { DriverPointCard } from './DriverPointCard.jsx';
import { InteractiveMap } from '../../components/Map/InteractiveMap.jsx';
import { Button, ProfileModal } from '../../components/index.js';
import {
  Truck,
  LogOut,
  RefreshCw,
  Phone,
  CheckCircle2,
  Crosshair,
  List,
  Map as MapIcon,
  RotateCcw,
  Play,
  Square,
} from 'lucide-react';

function formatDuration(min) {
  if (!min || min <= 0) return '0 min';
  if (min < 60) return `${min} min`;
  const hours = Math.floor(min / 60);
  const remaining = min % 60;
  return remaining > 0 ? `${hours}h ${remaining}m` : `${hours}h`;
}

function calculateHeading(lat1, lon1, lat2, lon2) {
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const y = Math.sin(dLon) * Math.cos((lat2 * Math.PI) / 180);
  const x =
    Math.cos((lat1 * Math.PI) / 180) * Math.sin((lat2 * Math.PI) / 180) -
    Math.sin((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.cos(dLon);
  const brng = (Math.atan2(y, x) * 180) / Math.PI;
  return Math.round((brng + 360) % 360);
}

export function DriverDashboard() {
  const { user, logout } = useAuth();
  const { socket, isConnected } = useSocket();
  const { activeRoute, fetchMyActiveRoute, updatePointStatus } = useLogistics();

  const [mobileTab, setMobileTab] = useState('stops');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [showCancelPrompt, setShowCancelPrompt] = useState(false);

  const [isGpsActive, setIsGpsActive] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [currentGps, setCurrentGps] = useState(null);
  const [recenterTrigger, setRecenterTrigger] = useState(0);

  const watchIdRef = useRef(null);
  const simulationIntervalRef = useRef(null);
  const simulationIndexRef = useRef(0);

  useEffect(() => {
    fetchMyActiveRoute();
  }, [fetchMyActiveRoute]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchMyActiveRoute();
    } finally {
      setIsRefreshing(false);
    }
  };

  const sortedPoints = useMemo(() => {
    if (!activeRoute?.routePoints) return [];
    return [...activeRoute.routePoints].sort((a, b) => a.stopSequence - b.stopSequence);
  }, [activeRoute]);

  const totalStops = sortedPoints.length;

  const currentStop = useMemo(() => {
    if (!sortedPoints.length) return null;
    return (
      sortedPoints.find(
        (p) => !p.actualArrival && p.order?.status !== 'DELIVERED' && p.order?.status !== 'CANCELLED'
      ) || null
    );
  }, [sortedPoints]);

  const deliveredStops = useMemo(() => {
    return sortedPoints.filter(
      (p) => Boolean(p.actualArrival) || p.order?.status === 'DELIVERED'
    ).length;
  }, [sortedPoints]);

  const progressPercentage = totalStops > 0 ? Math.round((deliveredStops / totalStops) * 100) : 0;

  const upcomingStops = useMemo(() => {
    if (!currentStop) return [];
    return sortedPoints.filter(
      (p) =>
        p.id !== currentStop.id &&
        !p.actualArrival &&
        p.order?.status !== 'DELIVERED' &&
        p.order?.status !== 'CANCELLED'
    );
  }, [sortedPoints, currentStop]);

  const completedStops = useMemo(() => {
    return sortedPoints.filter(
      (p) => Boolean(p.actualArrival) || p.order?.status === 'DELIVERED' || p.order?.status === 'CANCELLED'
    );
  }, [sortedPoints]);

  const mapOrders = useMemo(() => {
    return sortedPoints.map((p) => p.order).filter(Boolean);
  }, [sortedPoints]);

  const simulationCoords = useMemo(() => {
    if (activeRoute?.polylineGeometry) {
      try {
        const geo =
          typeof activeRoute.polylineGeometry === 'string'
            ? JSON.parse(activeRoute.polylineGeometry)
            : activeRoute.polylineGeometry;
        if (geo?.type === 'LineString' && Array.isArray(geo.coordinates) && geo.coordinates.length > 0) {
          return geo.coordinates;
        }
      } catch {}
    }
    if (sortedPoints.length > 0) {
      return sortedPoints
        .map((p) => (p.order?.longitude && p.order?.latitude ? [p.order.longitude, p.order.latitude] : null))
        .filter(Boolean);
    }
    return [];
  }, [activeRoute?.polylineGeometry, sortedPoints]);

  const stopGps = useCallback(() => {
    if (watchIdRef.current !== null && 'geolocation' in navigator) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsGpsActive(false);
    if (!isSimulating) {
      setCurrentGps(null);
    }
  }, [isSimulating]);

  const stopSimulation = useCallback(() => {
    if (simulationIntervalRef.current) {
      clearInterval(simulationIntervalRef.current);
      simulationIntervalRef.current = null;
    }
    setIsSimulating(false);
    setCurrentGps((prev) => (prev ? { ...prev, speed: 0 } : null));
  }, []);

  const startGps = useCallback(() => {
    if (!activeRoute?.id) return;

    if (isSimulating) {
      stopSimulation();
    }

    const broadcastCoords = (coords) => {
      setCurrentGps(coords);
      if (socket) {
        socket.emit('driver:location_update', {
          routeId: activeRoute.id,
          latitude: coords.latitude,
          longitude: coords.longitude,
          heading: coords.heading || 0,
          speed: coords.speed || 0,
        });
      }
    };

    if ('geolocation' in navigator) {
      setIsGpsActive(true);
      const wid = navigator.geolocation.watchPosition(
        (position) => {
          const speedKmh = position.coords.speed ? Math.round(position.coords.speed * 3.6) : 0;
          broadcastCoords({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            heading: position.coords.heading || 0,
            speed: speedKmh,
          });
        },
        () => {
          const defaultLat = currentStop?.order?.latitude || 53.8961;
          const defaultLng = currentStop?.order?.longitude || 27.5503;
          broadcastCoords({
            latitude: defaultLat,
            longitude: defaultLng,
            heading: 0,
            speed: 0,
          });
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
      watchIdRef.current = wid;
    } else {
      const defaultLat = currentStop?.order?.latitude || 53.8961;
      const defaultLng = currentStop?.order?.longitude || 27.5503;
      setIsGpsActive(true);
      broadcastCoords({
        latitude: defaultLat,
        longitude: defaultLng,
        heading: 0,
        speed: 0,
      });
    }
  }, [activeRoute, currentStop, isSimulating, socket, stopSimulation]);

  const toggleGps = useCallback(() => {
    if (isSimulating) {
      stopSimulation();
    }
    if (isGpsActive) {
      stopGps();
    } else {
      startGps();
    }
  }, [isSimulating, stopSimulation, isGpsActive, stopGps, startGps]);

  const startSimulation = useCallback(() => {
    if (!activeRoute?.id || simulationCoords.length < 2) return;

    if (watchIdRef.current !== null && 'geolocation' in navigator) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsGpsActive(false);

    if (simulationIntervalRef.current) {
      clearInterval(simulationIntervalRef.current);
    }

    setIsSimulating(true);

    if (simulationIndexRef.current >= simulationCoords.length) {
      simulationIndexRef.current = 0;
    }

    const stepSimulation = () => {
      const total = simulationCoords.length;
      const currentIndex = simulationIndexRef.current;
      const currentPt = simulationCoords[currentIndex];
      const nextPt = simulationCoords[(currentIndex + 1) % total];

      const heading = calculateHeading(currentPt[1], currentPt[0], nextPt[1], nextPt[0]);
      const speed = Math.floor(Math.random() * (52 - 45 + 1)) + 45;

      const loc = {
        latitude: currentPt[1],
        longitude: currentPt[0],
        heading,
        speed,
      };

      setCurrentGps(loc);

      if (socket) {
        socket.emit('driver:location_update', {
          routeId: activeRoute.id,
          latitude: currentPt[1],
          longitude: currentPt[0],
          heading,
          speed,
        });
      }

      simulationIndexRef.current = (currentIndex + 1) % total;
    };

    stepSimulation();
    simulationIntervalRef.current = setInterval(stepSimulation, 800);
  }, [activeRoute?.id, simulationCoords, socket]);

  const toggleSimulation = useCallback(() => {
    if (isSimulating) {
      stopSimulation();
    } else {
      startSimulation();
    }
  }, [isSimulating, stopSimulation, startSimulation]);

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null && 'geolocation' in navigator) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (simulationIntervalRef.current) {
        clearInterval(simulationIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!activeRoute && isSimulating) {
      stopSimulation();
    }
  }, [activeRoute, isSimulating, stopSimulation]);

  useEffect(() => {
    if (!socket) return;

    const handleRouteVehicleUpdated = (updatedRoute) => {
      if (activeRoute && activeRoute.id === updatedRoute.id && updatedRoute.vehicle) {
        activeRoute.vehicle = updatedRoute.vehicle;
        activeRoute.vehicleId = updatedRoute.vehicleId;
      }
    };

    socket.on('route:vehicle_updated', handleRouteVehicleUpdated);
    return () => {
      socket.off('route:vehicle_updated', handleRouteVehicleUpdated);
    };
  }, [socket, activeRoute]);

  const handleUpdateStatus = async (pointId, newStatus) => {
    if (!activeRoute) return;
    setIsUpdating(true);
    try {
      await updatePointStatus(activeRoute.id, pointId, newStatus);
    } finally {
      setIsUpdating(false);
    }
  };

  const recenterCoords = useMemo(() => {
    if (isSimulating && currentGps?.latitude && currentGps?.longitude) {
      return {
        latitude: currentGps.latitude,
        longitude: currentGps.longitude,
      };
    }
    if (currentStop?.order?.latitude && currentStop?.order?.longitude) {
      return {
        latitude: currentStop.order.latitude,
        longitude: currentStop.order.longitude,
      };
    }
    if (currentGps?.latitude && currentGps?.longitude) {
      return {
        latitude: currentGps.latitude,
        longitude: currentGps.longitude,
      };
    }
    return null;
  }, [isSimulating, currentStop, currentGps]);

  const handleRecenter = () => {
    setRecenterTrigger((prev) => prev + 1);
  };

  const isCurrentCancelled = currentStop?.order?.status === 'CANCELLED';

  const garageVehicle = useMemo(() => {
    if (user?.vehiclesAssigned && user.vehiclesAssigned.length > 0) {
      return user.vehiclesAssigned[0];
    }
    return null;
  }, [user?.vehiclesAssigned]);

  const assignedVehicle = activeRoute?.vehicle || garageVehicle;
  const vehicleDisplayText = assignedVehicle
    ? `${assignedVehicle.brand} (${assignedVehicle.licensePlate})`
    : null;

  return (
    <div className="h-screen w-screen bg-zinc-50 flex flex-col font-sans text-zinc-900 overflow-hidden">
      <header className="h-16 bg-white border-b border-zinc-200 px-5 flex items-center justify-between shrink-0 z-30 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-zinc-900 text-white flex items-center justify-center font-bold text-xs">
            <Truck className="h-4 w-4" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-zinc-900 leading-tight">
              {user?.fullName || 'Driver Workspace'}
            </h1>
            <div className="flex items-center gap-1.5 text-xs text-zinc-500">
              <span className="font-semibold text-zinc-900">Driver</span>
              <span>/</span>
              {vehicleDisplayText ? (
                <span className="font-medium text-zinc-600">
                  {vehicleDisplayText}
                </span>
              ) : (
                <span className="font-medium text-amber-600">
                  No vehicle assigned
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {activeRoute && (
            <button
              type="button"
              onClick={toggleSimulation}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                isSimulating
                  ? 'border-indigo-300 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 shadow-2xs'
                  : 'border-zinc-300 bg-white hover:bg-zinc-100 text-zinc-700 shadow-2xs'
              }`}
              title={isSimulating ? 'Stop route simulation' : 'Start demo simulation along route'}
            >
              {isSimulating ? (
                <>
                  <Square className="h-3 w-3 fill-indigo-600 text-indigo-600" />
                  <span>Stop Simulation</span>
                </>
              ) : (
                <>
                  <Play className="h-3 w-3 fill-zinc-700 text-zinc-700" />
                  <span>Start Simulation</span>
                </>
              )}
            </button>
          )}

          <button
            type="button"
            onClick={toggleGps}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
              isSimulating
                ? 'border-indigo-200 bg-indigo-50 text-indigo-700'
                : isGpsActive
                ? 'border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                : 'border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-600'
            }`}
            title={
              isSimulating
                ? 'Simulation is driving the vehicle'
                : isGpsActive
                ? 'Click to pause GPS telemetry'
                : 'Click to activate GPS telemetry'
            }
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isSimulating
                  ? 'bg-indigo-600 animate-pulse'
                  : isGpsActive
                  ? 'bg-emerald-500 animate-pulse'
                  : 'bg-zinc-400'
              }`}
            />
            <span>
              {isSimulating
                ? `Simulating (${currentGps?.speed || 0} km/h)`
                : isGpsActive
                ? `GPS Active (${currentGps?.speed || 0} km/h)`
                : 'GPS Idle (0 km/h)'}
            </span>
          </button>

          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
              isConnected
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-rose-50 text-rose-700 border-rose-200'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isConnected ? 'bg-emerald-500' : 'bg-rose-500'
              }`}
            />
            <span>{isConnected ? 'Online' : 'Offline'}</span>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            isLoading={isRefreshing}
            title="Refresh Route Data"
          >
            <RefreshCw className="h-4 w-4 text-zinc-500" />
          </Button>

          <button
            type="button"
            onClick={() => setIsProfileModalOpen(true)}
            className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-xs font-medium text-zinc-700 transition-colors cursor-pointer shadow-2xs"
            title="My Profile"
          >
            <div className="w-5 h-5 rounded-full bg-zinc-900 text-white flex items-center justify-center font-bold text-[10px]">
              {user?.fullName
                ? user.fullName
                    .split(' ')
                    .filter(Boolean)
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2)
                : 'D'}
            </div>
          </button>

          <Button variant="ghost" size="sm" onClick={logout} title="Sign Out">
            <LogOut className="h-4 w-4 text-zinc-500" />
          </Button>
        </div>
      </header>

      {activeRoute && totalStops > 0 && (
        <div className="lg:hidden bg-zinc-100 border-b border-zinc-200 p-2 flex gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setMobileTab('stops')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold text-center transition-all flex items-center justify-center gap-1.5 ${
              mobileTab === 'stops'
                ? 'bg-white text-zinc-900 shadow-2xs'
                : 'text-zinc-600'
            }`}
          >
            <List className="h-3.5 w-3.5" />
            <span>Stops List ({totalStops})</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('map')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold text-center transition-all flex items-center justify-center gap-1.5 ${
              mobileTab === 'map'
                ? 'bg-white text-zinc-900 shadow-2xs'
                : 'text-zinc-600'
            }`}
          >
            <MapIcon className="h-3.5 w-3.5" />
            <span>Route Map</span>
          </button>
        </div>
      )}

      {activeRoute && totalStops > 0 ? (
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden h-[calc(100vh-65px)]">
          <aside
            className={`w-full lg:w-[420px] bg-white border-r border-zinc-200 p-5 flex flex-col gap-4 overflow-y-auto shrink-0 shadow-2xs ${
              mobileTab === 'map' ? 'hidden lg:flex' : 'flex'
            }`}
          >
            <div className="space-y-1.5">
              <div className="text-xs font-medium text-zinc-600">
                Progress: {deliveredStops} of {totalStops} stops completed ({progressPercentage}%)
              </div>
              <div className="h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-zinc-900 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>

            {currentStop ? (
              <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 flex flex-col gap-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                    Current Active Stop - #{currentStop.stopSequence}
                  </span>
                  <span
                    className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded border ${
                      isCurrentCancelled
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : 'bg-white text-zinc-700 border-zinc-200'
                    }`}
                  >
                    {currentStop.order?.status}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-semibold text-zinc-900 leading-snug">
                    {currentStop.order?.deliveryAddress}
                  </h3>
                  <p className="text-xs text-zinc-500 mt-1">
                    {currentStop.order?.customerName}
                  </p>
                  {currentStop.order?.customerPhone && (
                    <a
                      href={`tel:${currentStop.order.customerPhone}`}
                      className="inline-flex items-center gap-1.5 text-xs text-zinc-700 hover:text-zinc-900 font-medium mt-1.5"
                    >
                      <Phone className="h-3 w-3 text-zinc-500" />
                      <span>{currentStop.order.customerPhone}</span>
                    </a>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs bg-white border border-zinc-200 px-2 py-0.5 rounded-md text-zinc-600 font-medium">
                    Weight: {currentStop.order?.weightKg} kg
                  </span>
                  <span className="text-xs bg-white border border-zinc-200 px-2 py-0.5 rounded-md text-zinc-600 font-medium">
                    Volume: {currentStop.order?.volumeM3} m³
                  </span>
                </div>

                {!showCancelPrompt ? (
                  <div className="flex flex-col gap-2 pt-1">
                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() => handleUpdateStatus(currentStop.id, 'DELIVERED')}
                      className="w-full bg-zinc-900 text-white hover:bg-zinc-800 active:scale-95 py-3 rounded-lg text-sm font-medium transition-all shadow-xs cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Mark as Delivered</span>
                    </button>

                    {isCurrentCancelled ? (
                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() => handleUpdateStatus(currentStop.id, 'IN_TRANSIT')}
                        className="inline-flex items-center justify-center gap-1.5 text-xs text-zinc-600 hover:text-zinc-900 font-medium mx-auto pt-1 cursor-pointer transition-colors"
                      >
                        <RotateCcw className="h-3 w-3" />
                        <span>Resume Delivery (In Transit)</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() => setShowCancelPrompt(true)}
                        className="text-xs text-zinc-500 hover:text-rose-600 transition-colors mx-auto pt-1 cursor-pointer"
                      >
                        Cancel Stop
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="p-3 bg-white border border-zinc-200 rounded-lg space-y-2 mt-1">
                    <p className="text-xs text-zinc-700 font-medium">
                      Confirm cancelling this delivery stop?
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() => {
                          setShowCancelPrompt(false);
                          handleUpdateStatus(currentStop.id, 'CANCELLED');
                        }}
                        className="flex-1 py-1.5 px-3 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold rounded-md cursor-pointer disabled:opacity-50"
                      >
                        Confirm Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowCancelPrompt(false)}
                        className="py-1.5 px-3 bg-white border border-zinc-200 text-zinc-600 text-xs font-semibold rounded-md hover:bg-zinc-50 cursor-pointer"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-5 text-center space-y-2">
                <CheckCircle2 className="h-8 w-8 text-zinc-900 mx-auto" />
                <h3 className="text-sm font-bold text-zinc-900">All Stops Completed</h3>
                <p className="text-xs text-zinc-500">
                  All customer orders for this route have been delivered.
                </p>
              </div>
            )}

            {upcomingStops.length > 0 && (
              <div className="space-y-2 pt-1">
                <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                  Upcoming Stops ({upcomingStops.length})
                </h4>
                <div className="space-y-2">
                  {upcomingStops.map((point) => (
                    <DriverPointCard key={point.id} point={point} />
                  ))}
                </div>
              </div>
            )}

            {completedStops.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-zinc-100">
                <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  Completed Stops ({completedStops.length})
                </h4>
                <div className="space-y-1.5">
                  {completedStops.map((point) => (
                    <DriverPointCard key={point.id} point={point} isCompleted />
                  ))}
                </div>
              </div>
            )}
          </aside>

          <main
            className={`flex-1 relative bg-zinc-100 h-full overflow-hidden ${
              mobileTab === 'stops' ? 'hidden lg:flex' : 'flex'
            }`}
          >
            <InteractiveMap
              orders={mapOrders}
              routes={activeRoute ? [activeRoute] : []}
              driverLocation={currentGps}
              centerCoords={recenterCoords}
              recenterTrigger={recenterTrigger}
              followDriver={isSimulating}
              className="w-full h-full"
            />

            <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
              <button
                type="button"
                onClick={toggleSimulation}
                className={`backdrop-blur border text-xs font-semibold py-1.5 px-3 rounded-lg shadow-sm flex items-center gap-1.5 cursor-pointer transition-colors ${
                  isSimulating
                    ? 'border-indigo-300 bg-indigo-50/95 text-indigo-700 hover:bg-indigo-100'
                    : 'border-zinc-200 bg-white/95 text-zinc-700 hover:bg-zinc-50'
                }`}
                title={isSimulating ? 'Stop route simulation' : 'Start demo simulation along route'}
              >
                {isSimulating ? (
                  <>
                    <Square className="h-3 w-3 fill-indigo-600 text-indigo-600" />
                    <span>Stop Simulation</span>
                  </>
                ) : (
                  <>
                    <Play className="h-3 w-3 fill-zinc-700 text-zinc-700" />
                    <span>Start Simulation</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleRecenter}
                className="bg-white/95 backdrop-blur border border-zinc-200 hover:bg-zinc-50 text-zinc-700 text-xs font-semibold py-1.5 px-3 rounded-lg shadow-sm flex items-center gap-1.5 cursor-pointer transition-colors"
                title="Recenter Map on Current Stop"
              >
                <Crosshair className="h-3.5 w-3.5 text-zinc-600" />
                <span>Recenter Map</span>
              </button>
            </div>

            <div className="absolute bottom-5 right-5 z-20 bg-white/95 backdrop-blur border border-zinc-200 rounded-xl p-3 shadow-lg flex items-center gap-4 text-center pointer-events-auto">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                  Speed
                </div>
                <div className="text-sm font-bold text-zinc-900 font-mono mt-0.5">
                  {(isGpsActive || isSimulating) && currentGps?.speed ? `${currentGps.speed} km/h` : '0 km/h'}
                </div>
              </div>

              <div className="w-px h-7 bg-zinc-200" />

              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                  Distance
                </div>
                <div className="text-sm font-bold text-zinc-900 font-mono mt-0.5">
                  {activeRoute.totalDistanceKm} km
                </div>
              </div>

              <div className="w-px h-7 bg-zinc-200" />

              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                  ETA
                </div>
                <div className="text-sm font-bold text-zinc-900 font-mono mt-0.5">
                  {formatDuration(activeRoute.totalDurationMin)}
                </div>
              </div>
            </div>
          </main>
        </div>
      ) : (
        <main className="flex-1 flex items-center justify-center p-6 bg-zinc-50">
          <div className="max-w-md w-full rounded-2xl border border-zinc-200 bg-white p-8 text-center space-y-4 shadow-xs">
            <div className="w-14 h-14 rounded-2xl bg-zinc-100 text-zinc-400 flex items-center justify-center mx-auto">
              <Truck className="h-7 w-7" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-base font-bold text-zinc-900">
                No active routes assigned
              </h2>
              <p className="text-xs text-zinc-500 max-w-xs mx-auto leading-relaxed">
                Waiting for dispatchers to prepare delivery routes. New assignments will appear here automatically.
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              isLoading={isRefreshing}
              className="gap-2 mx-auto border-zinc-300"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Check for New Route</span>
            </Button>
          </div>
        </main>
      )}

      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </div>
  );
}

export default DriverDashboard;
