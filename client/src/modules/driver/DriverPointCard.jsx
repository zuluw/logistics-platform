import { useState } from 'react';
import { Phone, MapPin, Package, CheckCircle2, Navigation, AlertCircle, XCircle } from 'lucide-react';

function getStatusBadge(status) {
  const styles = {
    PENDING: 'bg-slate-100 text-slate-700 border-slate-200',
    IN_TRANSIT: 'bg-amber-50 text-amber-700 border-amber-200',
    DELIVERED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    CANCELLED: 'bg-rose-50 text-rose-700 border-rose-200',
  };

  return (
    <span
      className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
        styles[status] || styles.PENDING
      }`}
    >
      {status}
    </span>
  );
}

export function DriverPointCard({
  point,
  onUpdateStatus,
  isUpdating = false,
}) {
  const [showCancelPrompt, setShowCancelPrompt] = useState(false);
  const order = point?.order;
  if (!order) return null;

  const isDelivered = order.status === 'DELIVERED';
  const isCancelled = order.status === 'CANCELLED';
  const isCompleted = isDelivered || isCancelled;
  const isInTransit = order.status === 'IN_TRANSIT';

  const formatArrival = (dateString) => {
    if (!dateString) return '';
    try {
      const d = new Date(dateString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div
      className={`rounded-2xl border transition-all p-4.5 bg-white shadow-xs ${
        isDelivered
          ? 'border-emerald-200 bg-emerald-50/20'
          : isCancelled
          ? 'border-rose-200 bg-rose-50/20'
          : isInTransit
          ? 'border-amber-300 ring-2 ring-amber-100'
          : 'border-slate-200'
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-7 h-7 rounded-full bg-slate-900 text-white text-xs font-bold shrink-0">
            #{point.stopSequence}
          </span>
          <h3 className="text-base font-bold text-slate-900 leading-snug">
            {order.customerName}
          </h3>
        </div>

        <div>{getStatusBadge(order.status)}</div>
      </div>

      <div className="space-y-2 mb-4 text-sm">
        <div className="flex items-start gap-2 text-slate-800">
          <MapPin className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
          <span className="font-semibold text-slate-900 leading-snug">
            {order.deliveryAddress}
          </span>
        </div>

        {order.customerPhone && (
          <div className="flex items-center gap-2 pl-6">
            <a
              href={`tel:${order.customerPhone}`}
              className="inline-flex items-center gap-1.5 text-indigo-600 hover:text-indigo-700 font-semibold"
            >
              <Phone className="h-3.5 w-3.5" />
              <span>{order.customerPhone}</span>
            </a>
          </div>
        )}

        <div className="flex items-center gap-4 pl-6 text-xs text-slate-500 pt-1">
          <span className="flex items-center gap-1">
            <Package className="h-3.5 w-3.5 text-slate-400" />
            <span>Weight: <strong>{order.weightKg} kg</strong></span>
          </span>
          <span>•</span>
          <span>Vol: <strong>{order.volumeM3} m³</strong></span>
        </div>
      </div>

      {isDelivered && (
        <div className="pt-3 border-t border-emerald-100 flex items-center justify-between text-xs text-emerald-700 font-semibold">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>Successfully Delivered</span>
          </div>
          {point.actualArrival && (
            <span className="text-emerald-600 font-mono">
              {formatArrival(point.actualArrival)}
            </span>
          )}
        </div>
      )}

      {isCancelled && (
        <div className="pt-3 border-t border-rose-100 flex items-center gap-1.5 text-xs text-rose-700 font-semibold">
          <XCircle className="h-4 w-4 text-rose-600" />
          <span>Delivery Cancelled</span>
        </div>
      )}

      {!isCompleted && (
        <div className="pt-3 border-t border-slate-100 space-y-2">
          {!isInTransit && (
            <button
              type="button"
              disabled={isUpdating}
              onClick={() => onUpdateStatus(point.id, 'IN_TRANSIT')}
              className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              <Navigation className="h-4 w-4" />
              <span>Start Travel to Point</span>
            </button>
          )}

          <button
            type="button"
            disabled={isUpdating}
            onClick={() => onUpdateStatus(point.id, 'DELIVERED')}
            className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-base flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
          >
            <CheckCircle2 className="h-5 w-5" />
            <span>Mark as Delivered</span>
          </button>

          {!showCancelPrompt ? (
            <button
              type="button"
              disabled={isUpdating}
              onClick={() => setShowCancelPrompt(true)}
              className="w-full py-2 px-3 text-xs text-slate-500 hover:text-rose-600 font-medium transition-colors cursor-pointer"
            >
              Report Issue / Cancel Stop
            </button>
          ) : (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-2">
              <div className="flex items-center gap-1.5 text-xs text-rose-700 font-semibold">
                <AlertCircle className="h-4 w-4 text-rose-600" />
                <span>Confirm cancelling this delivery?</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={() => {
                    setShowCancelPrompt(false);
                    onUpdateStatus(point.id, 'CANCELLED');
                  }}
                  className="flex-1 py-1.5 px-3 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-bold rounded-lg cursor-pointer disabled:opacity-50"
                >
                  Confirm Cancel
                </button>
                <button
                  type="button"
                  onClick={() => setShowCancelPrompt(false)}
                  className="py-1.5 px-3 bg-white border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default DriverPointCard;
