import { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useSocket } from '../../context/SocketContext.jsx';
import { useLogistics } from '../../context/LogisticsContext.jsx';
import { Button, ProfileModal } from '../../components/index.js';
import { InteractiveMap } from '../../components/Map/InteractiveMap.jsx';
import { OrdersListPanel } from './OrdersListPanel.jsx';
import { VehiclesListPanel } from './VehiclesListPanel.jsx';
import { RouteControlPanel } from './RouteControlPanel.jsx';
import { CreateOrderModal } from './CreateOrderModal.jsx';
import { Truck, LogOut, RefreshCw, Package, Route as RouteIcon } from 'lucide-react';

export function DispatcherDashboard({ onBackToAdmin } = {}) {
  const { user, logout } = useAuth();
  const { isConnected } = useSocket();
  const {
    orders,
    vehicles,
    routes,
    isLoading,
    refreshAll,
    createOrder,
    calculateRoute,
    createRoute,
  } = useLogistics();

  const [activeTab, setActiveTab] = useState('orders');
  const [selectedOrderIds, setSelectedOrderIds] = useState([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState(null);
  const [previewRoute, setPreviewRoute] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isCreatingRoute, setIsCreatingRoute] = useState(false);
  const [routeError, setRouteError] = useState(null);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [mapClickedCoords, setMapClickedCoords] = useState(null);

  const selectedVehicle = useMemo(() => {
    return vehicles.find((v) => v.id === selectedVehicleId) || null;
  }, [vehicles, selectedVehicleId]);

  const selectedOrders = useMemo(() => {
    return orders.filter((o) => selectedOrderIds.includes(o.id));
  }, [orders, selectedOrderIds]);

  const handleToggleOrder = (orderId) => {
    setSelectedOrderIds((prev) =>
      prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId]
    );
    setPreviewRoute(null);
    setRouteError(null);
  };

  const handleSelectAllOrders = (orderIds) => {
    setSelectedOrderIds(orderIds);
    setPreviewRoute(null);
    setRouteError(null);
  };

  const handleClearOrderSelection = () => {
    setSelectedOrderIds([]);
    setPreviewRoute(null);
    setRouteError(null);
  };

  const handleSelectVehicle = (vehicleId) => {
    setSelectedVehicleId(vehicleId);
    setPreviewRoute(null);
    setRouteError(null);
  };

  const handleCalculateRoute = async () => {
    if (!selectedVehicleId || selectedOrderIds.length === 0) return;

    setIsCalculating(true);
    setRouteError(null);

    try {
      const result = await calculateRoute({
        vehicleId: selectedVehicleId,
        orderIds: selectedOrderIds,
      });
      setPreviewRoute(result);
    } catch (err) {
      setRouteError(err.message || 'Failed to calculate optimized route');
    } finally {
      setIsCalculating(false);
    }
  };

  const handleCreateRoute = async (customDriverId) => {
    if (!previewRoute || !selectedVehicle) return;

    const driverId = customDriverId || selectedVehicle.currentDriverId || selectedVehicle.currentDriver?.id;
    if (!driverId) {
      setRouteError('Selected vehicle has no assigned driver');
      return;
    }

    setIsCreatingRoute(true);
    setRouteError(null);

    try {
      await createRoute({
        vehicleId: selectedVehicle.id,
        driverId,
        orderIds: selectedOrderIds,
      });

      setPreviewRoute(null);
      setSelectedOrderIds([]);
      setSelectedVehicleId(null);
      setActiveTab('orders');
    } catch (err) {
      setRouteError(err.message || 'Failed to confirm route');
    } finally {
      setIsCreatingRoute(false);
    }
  };

  const handleMapClick = (coords) => {
    setMapClickedCoords(coords);
    setIsCreateModalOpen(true);
  };

  const handleOpenCreateModalManual = () => {
    setMapClickedCoords(null);
    setIsCreateModalOpen(true);
  };

  const handleCreateOrderSubmit = async (orderPayload) => {
    await createOrder(orderPayload);
    setIsCreateModalOpen(false);
    setMapClickedCoords(null);
  };

  const pendingOrdersCount = orders.filter((o) => o.status === 'PENDING').length;
  const availableVehiclesCount = vehicles.filter((v) => v.status === 'AVAILABLE').length;

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-100 overflow-hidden">
      <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between shrink-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
            <Truck className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 leading-tight">
              Logistics Dispatcher
            </h1>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>{user?.fullName}</span>
              <span>/</span>
              <span className="font-semibold text-indigo-600">{user?.role}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {onBackToAdmin && (
            <button
              type="button"
              onClick={onBackToAdmin}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-xs font-semibold text-zinc-800 transition-colors cursor-pointer shadow-2xs"
              title="Return to Admin Control Center"
            >
              <span>&larr; Back to Admin</span>
            </button>
          )}
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
            variant="outline"
            size="sm"
            onClick={refreshAll}
            isLoading={isLoading}
            title="Refresh All Logistics Data"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>

          <button
            type="button"
            onClick={() => setIsProfileModalOpen(true)}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 transition-colors cursor-pointer shadow-2xs"
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
      </header>

      <div className="flex-1 flex overflow-hidden h-[calc(100vh-64px)]">
        <aside className="w-96 sm:w-104 bg-white border-r border-slate-200 flex flex-col shrink-0 z-20 shadow-xs">
          <div className="flex border-b border-slate-200 bg-slate-50/70 p-1.5 gap-1 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('orders')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'orders'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Package className="h-3.5 w-3.5" />
              <span>Orders</span>
              {pendingOrdersCount > 0 && (
                <span className="bg-indigo-100 text-indigo-700 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                  {pendingOrdersCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('vehicles')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'vehicles'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Truck className="h-3.5 w-3.5" />
              <span>Vehicles</span>
              {availableVehiclesCount > 0 && (
                <span className="bg-emerald-100 text-emerald-700 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                  {availableVehiclesCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('routes')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'routes'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <RouteIcon className="h-3.5 w-3.5" />
              <span>Build</span>
              {(selectedOrderIds.length > 0 || previewRoute) && (
                <span className="bg-amber-100 text-amber-700 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                  {selectedOrderIds.length}
                </span>
              )}
            </button>
          </div>

          <div className="flex-1 overflow-hidden">
            {activeTab === 'orders' && (
              <OrdersListPanel
                orders={orders}
                selectedOrderIds={selectedOrderIds}
                onToggleOrder={handleToggleOrder}
                onSelectAll={handleSelectAllOrders}
                onClearSelection={handleClearOrderSelection}
                onOpenCreateModal={handleOpenCreateModalManual}
              />
            )}

            {activeTab === 'vehicles' && (
              <VehiclesListPanel
                vehicles={vehicles}
                selectedVehicleId={selectedVehicleId}
                onSelectVehicle={handleSelectVehicle}
              />
            )}

            {activeTab === 'routes' && (
              <RouteControlPanel
                selectedVehicle={selectedVehicle}
                selectedOrders={selectedOrders}
                previewRoute={previewRoute}
                isCalculating={isCalculating}
                isCreating={isCreatingRoute}
                error={routeError}
                onCalculateRoute={handleCalculateRoute}
                onCreateRoute={handleCreateRoute}
                onClearPreview={() => {
                  setPreviewRoute(null);
                  setRouteError(null);
                }}
              />
            )}
          </div>
        </aside>

        <main className="flex-1 h-full relative z-0">
          <InteractiveMap
            orders={orders}
            routes={routes.filter((r) => r.status === 'ACTIVE')}
            activeRoutes={routes.filter((r) => r.status === 'ACTIVE')}
            previewRoute={previewRoute}
            selectedOrderIds={selectedOrderIds}
            onMapClick={handleMapClick}
          />

          <div className="absolute top-4 right-4 z-10 bg-white/95 backdrop-blur-xs rounded-xl shadow-md border border-slate-200/80 p-3 text-xs space-y-2 pointer-events-auto">
            <div className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">
              Map Legend
            </div>
            <div className="space-y-1.5 text-slate-600 text-[11px]">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-slate-900 border border-white shrink-0" />
                <span>Central Depot</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-blue-600 border border-white shrink-0" />
                <span>Pending Order</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-orange-500 border border-white shrink-0" />
                <span>In Transit Order</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500 border border-white shrink-0" />
                <span>Delivered Order</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-1 bg-blue-600 rounded-sm shrink-0" />
                <span>Active Route</span>
              </div>
              {previewRoute && (
                <div className="flex items-center gap-2">
                  <span className="w-4 h-1 bg-purple-600 rounded-sm shrink-0" />
                  <span>Optimized Preview</span>
                </div>
              )}
            </div>
            <div className="pt-1.5 border-t border-slate-100 text-[10px] text-slate-400">
              Click anywhere on map to add order
            </div>
          </div>
        </main>
      </div>

      <CreateOrderModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setMapClickedCoords(null);
        }}
        onSubmit={handleCreateOrderSubmit}
        initialCoords={mapClickedCoords}
      />

      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </div>
  );
}

export default DispatcherDashboard;
