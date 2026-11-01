import { CheckCircle2 } from 'lucide-react';

export function DriverPointCard({
  point,
  isCurrent = false,
  isCompleted = false,
}) {
  const order = point?.order;
  if (!order) return null;

  return (
    <div
      className={`rounded-lg border p-3 transition-all ${
        isCurrent
          ? 'bg-zinc-50 border-zinc-300 shadow-2xs'
          : isCompleted
          ? 'bg-white border-zinc-200/60 opacity-60'
          : 'bg-white border-zinc-200 hover:border-zinc-300'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2.5 min-w-0">
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
              isCompleted
                ? 'bg-zinc-200 text-zinc-700'
                : isCurrent
                ? 'bg-zinc-900 text-white'
                : 'bg-zinc-100 text-zinc-700'
            }`}
          >
            {isCompleted ? <CheckCircle2 className="h-3.5 w-3.5" /> : point.stopSequence}
          </div>

          <div className="min-w-0">
            <h4 className="text-xs font-semibold text-zinc-900 leading-snug truncate">
              {order.deliveryAddress}
            </h4>
            <div className="flex items-center gap-2 text-[11px] text-zinc-500 mt-0.5">
              <span>{order.customerName}</span>
              <span>/</span>
              <span>{order.weightKg} kg</span>
            </div>
          </div>
        </div>

        <span
          className={`text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded border shrink-0 ${
            order.status === 'DELIVERED'
              ? 'bg-zinc-100 text-zinc-700 border-zinc-200'
              : order.status === 'CANCELLED'
              ? 'bg-rose-50 text-rose-700 border-rose-200'
              : order.status === 'IN_TRANSIT'
              ? 'bg-zinc-900 text-white border-zinc-900'
              : 'bg-zinc-50 text-zinc-600 border-zinc-200'
          }`}
        >
          {order.status}
        </span>
      </div>
    </div>
  );
}

export default DriverPointCard;
