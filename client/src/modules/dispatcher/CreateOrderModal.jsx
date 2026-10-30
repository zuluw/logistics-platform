import { useState, useEffect } from 'react';
import { Modal, Button, Input } from '../../components/index.js';

export function CreateOrderModal({ isOpen, onClose, onSubmit, initialCoords }) {
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    deliveryAddress: '',
    weightKg: '',
    volumeM3: '',
    latitude: '',
    longitude: '',
    timeWindowStart: '',
    timeWindowEnd: '',
  });

  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialCoords) {
      setFormData((prev) => ({
        ...prev,
        latitude: initialCoords.lat ? String(initialCoords.lat) : prev.latitude,
        longitude: initialCoords.lng ? String(initialCoords.lng) : prev.longitude,
      }));
    }
  }, [initialCoords]);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const payload = {
        customerName: formData.customerName.trim(),
        customerPhone: formData.customerPhone.trim(),
        deliveryAddress: formData.deliveryAddress.trim(),
        weightKg: Number(formData.weightKg),
        volumeM3: Number(formData.volumeM3),
        latitude: Number(formData.latitude),
        longitude: Number(formData.longitude),
        timeWindowStart: formData.timeWindowStart || null,
        timeWindowEnd: formData.timeWindowEnd || null,
      };

      if (!payload.customerName || !payload.customerPhone || !payload.deliveryAddress) {
        throw new Error('Please fill in all required customer details');
      }

      if (isNaN(payload.weightKg) || payload.weightKg <= 0) {
        throw new Error('Weight must be a positive number');
      }

      if (isNaN(payload.volumeM3) || payload.volumeM3 <= 0) {
        throw new Error('Volume must be a positive number');
      }

      if (isNaN(payload.latitude) || payload.latitude < -90 || payload.latitude > 90) {
        throw new Error('Latitude must be between -90 and 90');
      }

      if (isNaN(payload.longitude) || payload.longitude < -180 || payload.longitude > 180) {
        throw new Error('Longitude must be between -180 and 180');
      }

      await onSubmit(payload);

      setFormData({
        customerName: '',
        customerPhone: '',
        deliveryAddress: '',
        weightKg: '',
        volumeM3: '',
        latitude: '',
        longitude: '',
        timeWindowStart: '',
        timeWindowEnd: '',
      });

      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create order');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Delivery Order"
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700">
            {error}
          </div>
        )}

        {initialCoords && (
          <div className="rounded-lg bg-indigo-50 border border-indigo-200 p-2.5 text-xs text-indigo-700 flex items-center justify-between">
            <span>Coordinates captured from map click</span>
            <span className="font-mono">{initialCoords.lat}, {initialCoords.lng}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <Input
            label="Customer Name"
            name="customerName"
            placeholder="TechnoSphere LLC"
            value={formData.customerName}
            onChange={handleChange}
            required
          />

          <Input
            label="Customer Phone"
            name="customerPhone"
            placeholder="+375291234567"
            value={formData.customerPhone}
            onChange={handleChange}
            required
          />
        </div>

        <Input
          label="Delivery Address"
          name="deliveryAddress"
          placeholder="10 Independence Ave, Minsk"
          value={formData.deliveryAddress}
          onChange={handleChange}
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <Input
            label="Weight (kg)"
            name="weightKg"
            type="number"
            step="0.1"
            placeholder="150"
            value={formData.weightKg}
            onChange={handleChange}
            required
          />

          <Input
            label="Volume (m³)"
            name="volumeM3"
            type="number"
            step="0.1"
            placeholder="1.2"
            value={formData.volumeM3}
            onChange={handleChange}
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <Input
            label="Latitude"
            name="latitude"
            type="number"
            step="0.000001"
            placeholder="53.8961"
            value={formData.latitude}
            onChange={handleChange}
            required
          />

          <Input
            label="Longitude"
            name="longitude"
            type="number"
            step="0.000001"
            placeholder="27.5503"
            value={formData.longitude}
            onChange={handleChange}
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <Input
            label="Time Window Start"
            name="timeWindowStart"
            type="time"
            value={formData.timeWindowStart}
            onChange={handleChange}
          />

          <Input
            label="Time Window End"
            name="timeWindowEnd"
            type="time"
            value={formData.timeWindowEnd}
            onChange={handleChange}
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <Button variant="outline" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" isLoading={isSubmitting}>
            Create Order
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default CreateOrderModal;
