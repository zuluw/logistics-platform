import { useState, useEffect } from 'react';
import { Modal, Button, Input } from '../../components/index.js';
import { apiClient } from '../../api/client.js';
import { AlertCircle } from 'lucide-react';

export function CreateVehicleModal({ isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    brand: '',
    licensePlate: '',
    capacityKg: '',
    volumeM3: '',
    currentDriverId: '',
  });

  const [drivers, setDrivers] = useState([]);
  const [isLoadingDrivers, setIsLoadingDrivers] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setIsLoadingDrivers(true);
      apiClient
        .get('/vehicles/drivers')
        .then((res) => {
          setDrivers(res?.data || res || []);
        })
        .catch((err) => {
          setError(err.message || 'Failed to load drivers');
        })
        .finally(() => {
          setIsLoadingDrivers(false);
        });
    }
  }, [isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const payload = {
        brand: formData.brand.trim(),
        licensePlate: formData.licensePlate.trim().toUpperCase(),
        capacityKg: Number(formData.capacityKg),
        volumeM3: Number(formData.volumeM3),
        currentDriverId: formData.currentDriverId || null,
      };

      if (!payload.brand || payload.brand.length < 2) {
        throw new Error('Vehicle brand must be at least 2 characters long');
      }

      if (!payload.licensePlate || payload.licensePlate.length < 3) {
        throw new Error('License plate must be at least 3 characters long');
      }

      if (isNaN(payload.capacityKg) || payload.capacityKg <= 0) {
        throw new Error('Payload capacity must be a positive number');
      }

      if (isNaN(payload.volumeM3) || payload.volumeM3 <= 0) {
        throw new Error('Cargo volume must be a positive number');
      }

      await apiClient.post('/vehicles', payload);

      setFormData({
        brand: '',
        licensePlate: '',
        capacityKg: '',
        volumeM3: '',
        currentDriverId: '',
      });

      if (onSuccess) {
        await onSuccess();
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create vehicle');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add New Fleet Vehicle"
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <Input
          label="Vehicle Brand and Model"
          name="brand"
          value={formData.brand}
          onChange={handleChange}
          placeholder="e.g. Ford Transit Custom"
          required
        />

        <Input
          label="License Plate Number"
          name="licensePlate"
          value={formData.licensePlate}
          onChange={handleChange}
          placeholder="e.g. 7788-AX-7"
          required
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Payload Capacity (kg)"
            name="capacityKg"
            type="number"
            min="1"
            step="1"
            value={formData.capacityKg}
            onChange={handleChange}
            placeholder="1500"
            required
          />
          <Input
            label="Cargo Volume (m3)"
            name="volumeM3"
            type="number"
            min="0.1"
            step="0.1"
            value={formData.volumeM3}
            onChange={handleChange}
            placeholder="12"
            required
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-zinc-700">
            Assign Driver (Optional)
          </label>
          <select
            name="currentDriverId"
            value={formData.currentDriverId}
            onChange={handleChange}
            disabled={isLoadingDrivers}
            className="w-full px-3 py-2 text-xs font-medium border border-zinc-200 rounded-lg bg-white text-zinc-800 focus:outline-hidden focus:ring-2 focus:ring-zinc-900 transition-all cursor-pointer disabled:opacity-50"
          >
            <option value="">-- No driver assigned (Unassigned) --</option>
            {drivers.map((d) => (
              <option key={d.id} value={d.id}>
                {d.fullName} {d.phone ? `(${d.phone})` : d.email ? `(${d.email})` : ''}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            size="sm"
            isLoading={isSubmitting}
            className="bg-zinc-900 hover:bg-zinc-800 text-white"
          >
            Create Vehicle
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default CreateVehicleModal;
