import { useState, useEffect } from 'react';
import { Truck, User, CheckCircle2, Plus, Edit2, AlertCircle, Download } from 'lucide-react';
import { exportVehiclesToCsv } from '../../utils/exportCsv.js';
import { Button } from '../../components/index.js';
import { CreateVehicleModal } from './CreateVehicleModal.jsx';
import { apiClient } from '../../api/client.js';
import { useLogistics } from '../../context/LogisticsContext.jsx';

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
  const { fetchVehicles } = useLogistics();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [availableDrivers, setAvailableDrivers] = useState([]);
  const [editingVehicleId, setEditingVehicleId] = useState(null);
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [isSavingDriver, setIsSavingDriver] = useState(false);
  const [actionError, setActionError] = useState(null);

  const loadDrivers = async () => {
    try {
      const res = await apiClient.get('/vehicles/drivers');
      setAvailableDrivers(res?.data || res || []);
    } catch {}
  };

  useEffect(() => {
    loadDrivers();
  }, []);

  const handleStartEditDriver = (e, vehicle) => {
    e.stopPropagation();
    setActionError(null);
    setEditingVehicleId(vehicle.id);
    setSelectedDriverId(vehicle.currentDriver?.id || vehicle.currentDriverId || '');
    loadDrivers();
  };

  const handleCancelEditDriver = (e) => {
    e.stopPropagation();
    setEditingVehicleId(null);
    setSelectedDriverId('');
    setActionError(null);
  };

  const handleSaveDriver = async (e, vehicleId) => {
    e.stopPropagation();
    setIsSavingDriver(true);
    setActionError(null);
    try {
      await apiClient.patch(`/vehicles/${vehicleId}`, {
        currentDriverId: selectedDriverId || null,
      });
      await fetchVehicles();
      setEditingVehicleId(null);
      setSelectedDriverId('');
    } catch (err) {
      setActionError(err.message || 'Failed to update vehicle driver');
    } finally {
      setIsSavingDriver(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white border-r border-zinc-200">
      <div className="p-4 border-b border-zinc-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-zinc-900" />
            <h2 className="text-sm font-bold text-zinc-900">Fleet Vehicles</h2>
            <span className="text-xs bg-zinc-100 text-zinc-700 px-2 py-0.5 rounded-full font-semibold">
              {vehicles.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => exportVehiclesToCsv(vehicles)}
              className="flex items-center gap-1.5 text-xs py-1 px-2.5 h-8 text-zinc-700 hover:text-zinc-900 bg-white shadow-2xs border-zinc-300"
              title="Export vehicles to CSV"
            >
              <Download className="h-3.5 w-3.5 text-zinc-500" />
              <span>Export CSV</span>
            </Button>

            <Button
              size="sm"
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs py-1 px-2.5 h-8"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Vehicle</span>
            </Button>
          </div>
        </div>
        <p className="text-xs text-zinc-500 mt-1">
          Select an available vehicle to plan and assign delivery routes.
        </p>

        {actionError && (
          <div className="mt-2 p-2 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-1.5">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            <span>{actionError}</span>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-zinc-100 p-2 space-y-1.5">
        {vehicles.length === 0 ? (
          <div className="py-12 text-center text-zinc-400">
            <Truck className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-xs font-medium text-zinc-600">No vehicles available</p>
          </div>
        ) : (
          vehicles.map((vehicle) => {
            const isSelected = selectedVehicleId === vehicle.id;
            const isAvailable = vehicle.status === 'AVAILABLE';
            const isEditingThis = editingVehicleId === vehicle.id;

            return (
              <div
                key={vehicle.id}
                onClick={() => isAvailable && onSelectVehicle(vehicle.id)}
                className={`p-3.5 rounded-lg border transition-all ${
                  isSelected
                    ? 'border-zinc-900 bg-zinc-50 shadow-xs'
                    : 'border-zinc-200 bg-white hover:border-zinc-300'
                } ${isAvailable ? 'cursor-pointer' : 'opacity-75 cursor-not-allowed'}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                        isSelected
                          ? 'bg-zinc-900 text-white'
                          : 'bg-zinc-100 text-zinc-700'
                      }`}
                    >
                      <Truck className="h-4 w-4" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-zinc-900 leading-snug">
                          {vehicle.brand}
                        </h4>
                        <span className="font-mono text-xs bg-zinc-100 text-zinc-800 px-1.5 py-0.5 rounded font-semibold border border-zinc-200">
                          {vehicle.licensePlate}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs mt-1.5">
                        <div className="flex items-center gap-1.5 text-zinc-600">
                          <User className="h-3.5 w-3.5 text-zinc-400" />
                          {vehicle.currentDriver ? (
                            <span className="font-medium text-zinc-900">
                              {vehicle.currentDriver.fullName}
                              {vehicle.currentDriver.phone && (
                                <span className="text-zinc-500 font-normal ml-1">
                                  ({vehicle.currentDriver.phone})
                                </span>
                              )}
                            </span>
                          ) : (
                            <span className="text-zinc-400 italic">No driver assigned</span>
                          )}
                        </div>

                        {!isEditingThis && (
                          <button
                            type="button"
                            onClick={(e) => handleStartEditDriver(e, vehicle)}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-600 hover:text-zinc-900 underline underline-offset-2 ml-1 cursor-pointer transition-colors"
                            title="Assign or change driver for this vehicle"
                          >
                            <Edit2 className="h-2.5 w-2.5" />
                            <span>{vehicle.currentDriver ? 'Change' : 'Assign'}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1.5">
                    {getVehicleStatusBadge(vehicle.status)}
                    {isSelected && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-900">
                        <CheckCircle2 className="h-3.5 w-3.5 text-zinc-900" />
                        Selected
                      </span>
                    )}
                  </div>
                </div>

                {isEditingThis && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="mt-3 pt-2.5 border-t border-zinc-200/80 bg-zinc-50/70 p-2.5 rounded-lg space-y-2 cursor-default"
                  >
                    <div className="text-[11px] font-semibold text-zinc-700">
                      Select Assigned Driver:
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={selectedDriverId}
                        onChange={(e) => setSelectedDriverId(e.target.value)}
                        disabled={isSavingDriver}
                        className="flex-1 text-xs px-2 py-1.5 border border-zinc-300 rounded-md bg-white text-zinc-800 focus:outline-hidden focus:ring-1 focus:ring-zinc-900"
                      >
                        <option value="">-- No driver (Unassigned) --</option>
                        {availableDrivers.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.fullName} {d.phone ? `(${d.phone})` : d.email ? `(${d.email})` : ''}
                          </option>
                        ))}
                      </select>

                      <button
                        type="button"
                        onClick={(e) => handleSaveDriver(e, vehicle.id)}
                        disabled={isSavingDriver}
                        className="px-2.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-md text-xs font-semibold disabled:opacity-50 cursor-pointer transition-colors"
                      >
                        {isSavingDriver ? '...' : 'Save'}
                      </button>

                      <button
                        type="button"
                        onClick={handleCancelEditDriver}
                        disabled={isSavingDriver}
                        className="px-2.5 py-1.5 bg-white border border-zinc-300 hover:bg-zinc-100 text-zinc-700 rounded-md text-xs font-medium cursor-pointer transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                <div className="mt-3 pt-2.5 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-600">
                  <div>
                    Max Payload: <strong className="text-zinc-900">{vehicle.capacityKg} kg</strong>
                  </div>
                  <div>
                    Cargo Volume: <strong className="text-zinc-900">{vehicle.volumeM3} m<sup>3</sup></strong>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <CreateVehicleModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={fetchVehicles}
      />
    </div>
  );
}

export default VehiclesListPanel;
