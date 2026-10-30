import { Truck, User, CheckCircle2 } from 'lucide-react';

function getVehicleStatusBadge(status) {
  const styles = {
    AVAILABLE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    IN_TRANSIT: 'bg-amber-50 text-amber-700 border-amber-200',
    MAINTENANCE: 'bg-rose-50 text-rose-700 border-rose-200',
  };

  return (
    <span
      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
        styles[status] || styles.AVAILABLE
      }`}
    >
      {status}
    </span>
  );
}

export function VehiclesListPanel({
  vehicles = [],
  selectedVehicleId = null,
  onSelectVehicle,
}) {
  return (
    <div className="flex flex-col h-full bg-white border-r border-slate-200">
      <div className="p-4 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">Fleet Vehicles</h2>
            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
              {vehicles.length}
            </span>
          </div>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Select an available vehicle to plan and assign delivery routes.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 space-y-1.5">
        {vehicles.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <Truck className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-xs font-medium text-slate-600">No vehicles available</p>
          </div>
        ) : (
          vehicles.map((vehicle) => {
            const isSelected = selectedVehicleId === vehicle.id;
            const isAvailable = vehicle.status === 'AVAILABLE';

            return (
              <div
                key={vehicle.id}
                onClick={() => isAvailable && onSelectVehicle(vehicle.id)}
                className={`p-3.5 rounded-lg border transition-all ${
                  isSelected
                    ? 'border-indigo-400 bg-indigo-50/60 shadow-xs'
                    : 'border-slate-200/80 bg-white hover:border-slate-300'
                } ${isAvailable ? 'cursor-pointer' : 'opacity-70 cursor-not-allowed'}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                        isSelected
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <Truck className="h-4 w-4" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-900 leading-snug">
                          {vehicle.brand}
                        </h4>
                        <span className="font-mono text-xs bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-semibold border border-slate-200">
                          {vehicle.licensePlate}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                        <User className="h-3 w-3 text-slate-400" />
                        <span>
                          Driver: {vehicle.currentDriver?.fullName || 'Not assigned'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1.5">
                    {getVehicleStatusBadge(vehicle.status)}
                    {isSelected && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-700">
                        <CheckCircle2 className="h-3.5 w-3.5 text-indigo-600" />
                        Selected
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                  <div>
                    Max Payload: <strong className="text-slate-900">{vehicle.capacityKg} kg</strong>
                  </div>
                  <div>
                    Cargo Volume: <strong className="text-slate-900">{vehicle.volumeM3} m³</strong>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default VehiclesListPanel;
