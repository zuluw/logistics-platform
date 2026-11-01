import { useState, useEffect } from 'react';
import { Button } from '../../components/index.js';
import { Route, Navigation, Clock, AlertTriangle, CheckCircle, RotateCcw, User, Printer } from 'lucide-react';
import { apiClient } from '../../api/client.js';
import { printWaybill } from '../../utils/printWaybill.js';

export function RouteControlPanel({
  selectedVehicle,
  selectedOrders = [],
  previewRoute = null,
  isCalculating = false,
  isCreating = false,
  error = null,
  routes = [],
  lastCreatedRoute = null,
  onDismissCreatedRoute,
  onCalculateRoute,
  onCreateRoute,
  onClearPreview,
}) {
  const [drivers, setDrivers] = useState([]);
  const [selectedDriverId, setSelectedDriverId] = useState('');

  useEffect(() => {
    apiClient
      .get('/vehicles/drivers')
      .then((res) => setDrivers(res?.data || res || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const defaultDriverId = selectedVehicle?.currentDriverId || selectedVehicle?.currentDriver?.id || '';
    setSelectedDriverId(defaultDriverId);
  }, [selectedVehicle]);

  const totalWeight = selectedOrders.reduce((sum, o) => sum + (Number(o.weightKg) || 0), 0);
  const totalVolume = selectedOrders.reduce((sum, o) => sum + (Number(o.volumeM3) || 0), 0);
  const capacity = selectedVehicle ? selectedVehicle.capacityKg : 0;
  const weightPercentage = capacity > 0 ? Math.round((totalWeight / capacity) * 100) : 0;
  const isOverweight = capacity > 0 && totalWeight > capacity;

  const canOptimize =
    selectedVehicle &&
    selectedOrders.length > 0 &&
    !isOverweight &&
    selectedVehicle.status === 'AVAILABLE';

  const effectiveDriverId = selectedDriverId || selectedVehicle?.currentDriverId || selectedVehicle?.currentDriver?.id;

  const canCreate =
    previewRoute &&
    selectedVehicle &&
    effectiveDriverId &&
    !isCreating;

  const activeRoutesList = (routes || []).filter((r) => r.status === 'ACTIVE');

  return (
    <div className="flex flex-col h-full bg-white border-r border-slate-200">
      <div className="p-4 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <Route className="h-5 w-5 text-indigo-600" />
          <h2 className="text-base font-bold text-slate-900">Route Builder</h2>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Combine fleet vehicle and orders pool to compute the optimal delivery route.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {error && (
          <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {lastCreatedRoute && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-800">
                <CheckCircle className="h-4 w-4 text-emerald-600" />
                <span>Route Successfully Created</span>
              </div>
              {onDismissCreatedRoute && (
                <button
                  type="button"
                  onClick={onDismissCreatedRoute}
                  className="text-slate-400 hover:text-slate-600 text-sm font-bold leading-none cursor-pointer"
                  title="Dismiss"
                >
                  &times;
                </button>
              )}
            </div>

            <div className="rounded-lg bg-white border border-emerald-100 p-2.5 space-y-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">
                  {lastCreatedRoute.vehicle?.brand} ({lastCreatedRoute.vehicle?.licensePlate})
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-700">
                  {lastCreatedRoute.status}
                </span>
              </div>
              <div className="text-slate-600">
                Driver: <span className="font-semibold text-slate-800">{lastCreatedRoute.driver?.fullName || 'Assigned'}</span>
              </div>
              <div className="text-[11px] text-slate-500">
                {Number(lastCreatedRoute.totalDistanceKm || 0).toFixed(1)} km &bull; {lastCreatedRoute.totalDurationMin} min &bull; {(lastCreatedRoute.routePoints || []).length} stops
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full gap-1.5 text-xs border-emerald-300 text-emerald-800 hover:bg-emerald-100 bg-white"
              onClick={() => printWaybill(lastCreatedRoute)}
              title="Print Official Waybill"
            >
              <Printer className="h-3.5 w-3.5 text-emerald-700" />
              <span>Print Waybill</span>
            </Button>
          </div>
        )}

        <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3.5 space-y-2.5">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-500">
            <span>Selected Vehicle</span>
            {selectedVehicle ? (
              <span className="text-indigo-600 font-bold">{selectedVehicle.licensePlate}</span>
            ) : (
              <span className="text-amber-600 font-normal">None selected</span>
            )}
          </div>

          {selectedVehicle ? (
            <div className="text-xs space-y-1">
              <div className="text-sm font-bold text-slate-900">{selectedVehicle.brand}</div>
              <div className="text-slate-600">
                Max Payload: <strong>{selectedVehicle.capacityKg} kg</strong> | Volume: <strong>{selectedVehicle.volumeM3} m<sup>3</sup></strong>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400">
              Please choose a vehicle from the Vehicles tab.
            </p>
          )}
        </div>

        {selectedVehicle && (
          <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3.5 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-500">
              <span className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-slate-400" />
                <span>Assigned Route Driver</span>
              </span>
              {selectedVehicle.currentDriver && (
                <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                  Fleet Assigned
                </span>
              )}
            </div>

            <select
              value={selectedDriverId}
              onChange={(e) => setSelectedDriverId(e.target.value)}
              className="w-full text-xs font-medium border border-slate-300 rounded-lg px-2.5 py-2 bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="">-- Choose Assigned Driver --</option>
              {drivers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.fullName} {d.phone ? `(${d.phone})` : d.email ? `(${d.email})` : ''}
                </option>
              ))}
            </select>

            {!effectiveDriverId && (
              <p className="text-[11px] text-amber-600 font-medium">
                Vehicle has no driver attached. Select a driver above to dispatch this route.
              </p>
            )}
          </div>
        )}

        <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3.5 space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-500">
            <span>Orders Batch ({selectedOrders.length})</span>
            <span className={isOverweight ? 'text-rose-600 font-bold' : 'text-slate-700 font-bold'}>
              {totalWeight.toFixed(1)} / {capacity} kg
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
              <div
                className={`h-2 rounded-full transition-all ${
                  isOverweight
                    ? 'bg-rose-500'
                    : weightPercentage > 85
                    ? 'bg-amber-500'
                    : 'bg-indigo-600'
                }`}
                style={{ width: `${Math.min(weightPercentage, 100)}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span>Capacity utilization</span>
              <span className={isOverweight ? 'font-bold text-rose-600' : 'font-medium'}>
                {weightPercentage}%
              </span>
            </div>
          </div>

          {isOverweight && (
            <div className="text-xs text-rose-600 font-medium flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>Weight limit exceeded! Remove some orders.</span>
            </div>
          )}

          {selectedOrders.length === 0 && (
            <p className="text-xs text-slate-400">
              Select orders from the Orders tab using checkboxes.
            </p>
          )}
        </div>

        {!previewRoute && (
          <Button
            variant="primary"
            className="w-full gap-2 py-2.5 shadow-sm"
            disabled={!canOptimize}
            isLoading={isCalculating}
            onClick={onCalculateRoute}
          >
            <Navigation className="h-4 w-4" />
            <span>Optimize & Build Route</span>
          </Button>
        )}

        {previewRoute && (
          <div className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-4 space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-indigo-700">
                <CheckCircle className="h-4 w-4 text-indigo-600" />
                <span>Calculated Plan Preview</span>
              </div>
              <button
                type="button"
                onClick={onClearPreview}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                title="Discard Preview"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="rounded-lg bg-white p-2.5 border border-indigo-100 shadow-2xs">
                <div className="flex items-center justify-center gap-1 text-slate-500 text-xs mb-1">
                  <Navigation className="h-3.5 w-3.5 text-indigo-500" />
                  <span>Total Distance</span>
                </div>
                <span className="text-lg font-extrabold text-slate-900">
                  {previewRoute.distanceKm.toFixed(1)} km
                </span>
              </div>

              <div className="rounded-lg bg-white p-2.5 border border-indigo-100 shadow-2xs">
                <div className="flex items-center justify-center gap-1 text-slate-500 text-xs mb-1">
                  <Clock className="h-3.5 w-3.5 text-indigo-500" />
                  <span>Est. Duration</span>
                </div>
                <span className="text-lg font-extrabold text-slate-900">
                  {previewRoute.durationMin} min
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="text-xs font-semibold text-slate-700">
                Optimized Waypoints Sequence ({previewRoute.orderedOrders?.length || 0} stops):
              </div>
              <div className="max-h-40 overflow-y-auto divide-y divide-indigo-100/60 rounded-lg bg-white border border-indigo-100 p-2 text-xs">
                {previewRoute.orderedOrders?.map((order, idx) => (
                  <div key={order.id} className="py-1.5 flex items-center gap-2">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold shrink-0">
                      {idx + 1}
                    </span>
                    <div className="truncate">
                      <p className="font-semibold text-slate-800 truncate">{order.customerName}</p>
                      <p className="text-[11px] text-slate-500 truncate">{order.deliveryAddress}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {!effectiveDriverId && (
              <p className="text-xs text-rose-600 font-medium">
                The selected vehicle does not have a driver assigned. Assign a driver before confirming.
              </p>
            )}

            <div className="flex items-center gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                className="flex-1 gap-1.5 text-xs border-indigo-200 text-indigo-700 hover:bg-indigo-50 bg-white"
                onClick={() =>
                  printWaybill({
                    ...previewRoute,
                    id: 'PREVIEW-ROUTE',
                    routeDate: new Date(),
                    vehicle: selectedVehicle,
                    driver: drivers.find((d) => d.id === effectiveDriverId),
                    dispatcher: { fullName: 'Logistics Dispatcher' },
                  })
                }
                title="Print Waybill (PDF)"
              >
                <Printer className="h-3.5 w-3.5 text-indigo-600" />
                <span>Print Waybill</span>
              </Button>

              <Button
                variant="primary"
                className="flex-1 gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500"
                disabled={!canCreate}
                isLoading={isCreating}
                onClick={() => onCreateRoute(effectiveDriverId)}
              >
                <CheckCircle className="h-3.5 w-3.5" />
                <span>Confirm & Create</span>
              </Button>
            </div>
          </div>
        )}

        {activeRoutesList.length > 0 && (
          <div className="space-y-3 pt-3 border-t border-slate-200">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-700">
              <div className="flex items-center gap-1.5">
                <Route className="h-3.5 w-3.5 text-slate-500" />
                <span>Active Dispatched Routes ({activeRoutesList.length})</span>
              </div>
            </div>

            <div className="space-y-2.5">
              {activeRoutesList.map((route) => (
                <div
                  key={route.id}
                  className="rounded-lg border border-slate-200 bg-slate-50/70 p-3 space-y-2 transition-all hover:border-slate-300"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 truncate">
                      {route.vehicle ? `${route.vehicle.brand} (${route.vehicle.licensePlate})` : 'Assigned Fleet'}
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-700 border border-emerald-200 shrink-0">
                      {route.status}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-600 space-y-0.5">
                    <div>
                      Driver: <span className="font-semibold text-slate-800">{route.driver?.fullName || 'Unassigned'}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-500 pt-0.5">
                      <span>{Number(route.totalDistanceKm || 0).toFixed(1)} km &bull; {route.totalDurationMin} min</span>
                      <span>{(route.routePoints || []).length} stops</span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full gap-1.5 text-xs text-slate-700 hover:text-slate-900 bg-white"
                    onClick={() => printWaybill(route)}
                    title="Print Waybill (PDF)"
                  >
                    <Printer className="h-3.5 w-3.5 text-slate-500" />
                    <span>Print Waybill</span>
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default RouteControlPanel;
