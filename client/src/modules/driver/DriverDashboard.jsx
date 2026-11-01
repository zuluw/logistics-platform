import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useSocket } from '../../context/SocketContext.jsx';
import { useLogistics } from '../../context/LogisticsContext.jsx';
import { DriverPointCard } from './DriverPointCard.jsx';
import { InteractiveMap } from '../../components/Map/InteractiveMap.jsx';
import { Button, ProfileModal } from '../../components/index.js';
import { Truck, LogOut, RefreshCw, Wifi, WifiOff, Map, MapPin, Clock, Route as RouteIcon } from 'lucide-react';

export function DriverDashboard() {
  const { user, logout } = useAuth();
  const { isConnected } = useSocket();
  const { activeRoute, fetchMyActiveRoute, updatePointStatus } = useLogistics();

  const [showMap, setShowMap] = useState(false);
  const [updatingPointId, setUpdatingPointId] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

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

  const handleUpdateStatus = async (pointId, newStatus) => {
    if (!activeRoute) return;
    setUpdatingPointId(pointId);
    try {
      await updatePointStatus(activeRoute.id, pointId, newStatus);
    } finally {
      setUpdatingPointId(null);
    }
  };

  const sortedPoints = useMemo(() => {
    if (!activeRoute?.routePoints) return [];
    return [...activeRoute.routePoints].sort((a, b) => a.stopSequence - b.stopSequence);
  }, [activeRoute]);

  const totalStops = sortedPoints.length;
  const deliveredStops = sortedPoints.filter((p) => p.order?.status === 'DELIVERED').length;
  const progressPercentage = totalStops > 0 ? Math.round((deliveredStops / totalStops) * 100) : 0;

  const mapOrders = useMemo(() => {
    return sortedPoints.map((p) => p.order).filter(Boolean);
  }, [sortedPoints]);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col pb-8">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-900 leading-tight">
                {user?.fullName || 'Driver Workspace'}
              </h1>
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <span className="font-semibold text-emerald-700">Driver</span>
                {activeRoute?.vehicle && (
                  <>
                    <span>•</span>
                    <span className="font-medium text-slate-700">
                      {activeRoute.vehicle.licensePlate}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                isConnected
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}
            >
              {isConnected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
              <span>{isConnected ? 'Live' : 'Offline'}</span>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              isLoading={isRefreshing}
              title="Refresh Route"
            >
              <RefreshCw className="h-4 w-4 text-slate-500" />
            </Button>

            <button
              type="button"
              onClick={() => setIsProfileModalOpen(true)}
              className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 transition-colors cursor-pointer shadow-2xs"
              title="My Profile"
            >
              <div className="w-5 h-5 rounded-full bg-zinc-900 text-white flex items-center justify-center font-bold text-[10px]">
                {user?.fullName ? user.fullName.split(' ').filter(Boolean).map((n) => n[0]).join('').toUpperCase().slice(0, 2) : 'U'}
              </div>
              <span className="hidden sm:inline font-medium text-slate-700">{user?.fullName}</span>
            </button>

            <Button variant="ghost" size="sm" onClick={logout} title="Sign Out">
              <LogOut className="h-4 w-4 text-slate-500" />
            </Button>
          </div>
        </div>

        {activeRoute && totalStops > 0 && (
          <div className="max-w-md mx-auto px-4 pb-3 pt-1 border-t border-slate-100">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1.5">
              <span>Delivery Progress</span>
              <span className="text-emerald-700 font-bold">
                {deliveredStops} of {totalStops} delivered ({progressPercentage}%)
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-emerald-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        )}
      </header>

      <main className="flex-1 max-w-md w-full mx-auto p-4 space-y-4">
        {activeRoute ? (
          <>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Active Assignment
                  </div>
                  <h2 className="text-base font-extrabold text-slate-900 mt-0.5">
                    {activeRoute.vehicle?.brand} ({activeRoute.vehicle?.licensePlate})
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() => setShowMap((prev) => !prev)}
                  className={`py-1.5 px-3 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
                    showMap
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                      : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Map className="h-3.5 w-3.5" />
                  <span>{showMap ? 'Hide Map' : 'Show Map'}</span>
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-100 text-center">
                <div className="p-2 rounded-xl bg-slate-50">
                  <div className="flex items-center justify-center gap-1 text-[11px] text-slate-500 mb-0.5">
                    <RouteIcon className="h-3 w-3 text-indigo-600" />
                    <span>Distance</span>
                  </div>
                  <span className="text-sm font-extrabold text-slate-900">
                    {activeRoute.totalDistanceKm} km
                  </span>
                </div>

                <div className="p-2 rounded-xl bg-slate-50">
                  <div className="flex items-center justify-center gap-1 text-[11px] text-slate-500 mb-0.5">
                    <Clock className="h-3 w-3 text-indigo-600" />
                    <span>Est. Time</span>
                  </div>
                  <span className="text-sm font-extrabold text-slate-900">
                    {activeRoute.totalDurationMin} min
                  </span>
                </div>

                <div className="p-2 rounded-xl bg-slate-50">
                  <div className="flex items-center justify-center gap-1 text-[11px] text-slate-500 mb-0.5">
                    <MapPin className="h-3 w-3 text-indigo-600" />
                    <span>Stops</span>
                  </div>
                  <span className="text-sm font-extrabold text-slate-900">
                    {totalStops}
                  </span>
                </div>
              </div>
            </div>

            {showMap && (
              <div className="h-64 rounded-2xl overflow-hidden border border-slate-200 shadow-sm relative z-0">
                <InteractiveMap
                  orders={mapOrders}
                  routes={[activeRoute]}
                />
              </div>
            )}

            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Delivery Stops ({totalStops})
                </h3>
                <span className="text-xs text-slate-400">Follow stop order</span>
              </div>

              <div className="space-y-3">
                {sortedPoints.map((point) => (
                  <DriverPointCard
                    key={point.id}
                    point={point}
                    isUpdating={updatingPointId === point.id}
                    onUpdateStatus={handleUpdateStatus}
                  />
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center space-y-4 shadow-xs mt-8">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Truck className="h-8 w-8" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-lg font-bold text-slate-900">
                No active routes assigned yet
              </h2>
              <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                Waiting for dispatcher to build and assign your delivery route. When assigned, it will automatically appear on this screen.
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              isLoading={isRefreshing}
              className="gap-2 mx-auto"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Check for New Route</span>
            </Button>
          </div>
        )}
      </main>

      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </div>
  );
}

export default DriverDashboard;
