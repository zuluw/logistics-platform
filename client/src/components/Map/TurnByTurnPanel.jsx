import { useState, useEffect, useRef } from 'react';
import {
  Navigation,
  ListOrdered,
  CornerUpLeft,
  CornerUpRight,
  ArrowUp,
  Flag,
  ChevronRight,
  RotateCcw,
  RotateCw,
  Check,
} from 'lucide-react';

function getManeuverIcon(type, modifier) {
  if (type === 'arrive') return Flag;
  if (modifier?.includes('left')) return CornerUpLeft;
  if (modifier?.includes('right')) return CornerUpRight;
  if (modifier === 'uturn') return RotateCcw;
  if (type === 'roundabout' || type === 'rotary') return RotateCw;
  return ArrowUp;
}

function formatDistance(meters) {
  if (!meters || meters <= 0) return '0 m';
  if (meters < 1000) return `${meters} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

export function TurnByTurnPanel({
  steps = [],
  onStepClick,
  activeStepIndex = -1,
  currentDistanceMeters = null,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const activeStepRef = useRef(null);

  useEffect(() => {
    if (activeStepIndex >= 0 && activeStepRef.current) {
      activeStepRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [activeStepIndex, isOpen]);

  if (!steps || steps.length === 0) {
    return null;
  }

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="absolute top-4 right-4 z-[1000] flex items-center gap-2 px-3 py-2 bg-white/95 backdrop-blur-md border border-zinc-200/90 rounded-xl shadow-lg hover:bg-zinc-50 text-xs font-semibold text-zinc-800 transition-all cursor-pointer pointer-events-auto"
        title="Show driving directions"
      >
        <ListOrdered className="w-4 h-4 text-zinc-700" />
        <span>Show Steps ({steps.length})</span>
        {activeStepIndex >= 0 && (
          <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
        )}
      </button>
    );
  }

  return (
    <div className="absolute top-4 right-4 z-[1000] w-80 max-h-[calc(100vh-140px)] flex flex-col bg-white/95 backdrop-blur-md border border-zinc-200 rounded-xl shadow-xl overflow-hidden pointer-events-auto">
      <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-zinc-200/80 bg-zinc-50/80 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <Navigation className="w-4 h-4 text-zinc-700 shrink-0" />
          <span className="text-xs font-bold text-zinc-900 truncate">Driving Steps</span>
          <span className="text-[10px] font-semibold text-zinc-600 bg-zinc-200/70 px-1.5 py-0.5 rounded-full shrink-0">
            {steps.length}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="text-zinc-400 hover:text-zinc-700 p-1 rounded-md hover:bg-zinc-200/60 transition-colors cursor-pointer"
          title="Hide directions"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
        {steps.map((step, index) => {
          const isActive = activeStepIndex === index;
          const isCompleted = activeStepIndex >= 0 && index < activeStepIndex;
          const Icon = getManeuverIcon(step.type, step.modifier);

          if (isActive) {
            return (
              <button
                key={index}
                ref={activeStepRef}
                type="button"
                onClick={() => onStepClick?.(step.location)}
                className="w-full flex items-start gap-2.5 p-2 rounded-lg text-left transition-all border border-blue-500 bg-blue-50/70 text-blue-900 shadow-sm cursor-pointer"
              >
                <div className="mt-0.5 p-1.5 rounded-md bg-blue-600 text-white shrink-0 shadow-2xs">
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-blue-600 text-white shadow-2xs">
                      Next Maneuver
                    </span>
                  </div>
                  <div className="text-xs font-bold text-blue-950 leading-snug">
                    {step.instruction}
                  </div>
                  <div className="text-[11px] text-blue-700 mt-1 flex items-center justify-between">
                    {step.streetName && step.streetName !== 'Unnamed Road' ? (
                      <span className="truncate max-w-[130px] font-semibold text-blue-900">
                        {step.streetName}
                      </span>
                    ) : (
                      <span />
                    )}
                    <span className="font-bold text-blue-800 font-mono">
                      {formatDistance(currentDistanceMeters ?? step.distanceMeters)}
                    </span>
                  </div>
                </div>
              </button>
            );
          }

          if (isCompleted) {
            return (
              <button
                key={index}
                type="button"
                onClick={() => onStepClick?.(step.location)}
                className="w-full flex items-start gap-2.5 p-2 rounded-lg text-left transition-all border border-transparent opacity-50 text-zinc-400 hover:opacity-75 cursor-pointer"
              >
                <div className="mt-0.5 p-1.5 rounded-md bg-emerald-100 text-emerald-700 shrink-0">
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-zinc-500 leading-snug">
                    {step.instruction}
                  </div>
                  <div className="text-[11px] text-zinc-400 mt-0.5 flex items-center justify-between">
                    {step.streetName && step.streetName !== 'Unnamed Road' ? (
                      <span className="truncate max-w-[130px]">
                        {step.streetName}
                      </span>
                    ) : (
                      <span />
                    )}
                    <span>{formatDistance(step.distanceMeters)}</span>
                  </div>
                </div>
              </button>
            );
          }

          return (
            <button
              key={index}
              type="button"
              onClick={() => onStepClick?.(step.location)}
              className="w-full flex items-start gap-2.5 p-2 rounded-lg text-left hover:bg-zinc-100/90 active:bg-zinc-200/80 transition-colors border border-transparent hover:border-zinc-200/70 cursor-pointer group"
            >
              <div className="mt-0.5 p-1.5 rounded-md bg-zinc-100 text-zinc-700 group-hover:bg-zinc-900 group-hover:text-white transition-colors shrink-0">
                <Icon className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-zinc-900 leading-snug">
                  {step.instruction}
                </div>
                <div className="text-[11px] text-zinc-500 mt-0.5 flex items-center justify-between">
                  {step.streetName && step.streetName !== 'Unnamed Road' ? (
                    <span className="truncate max-w-[130px] font-medium text-zinc-600">
                      {step.streetName}
                    </span>
                  ) : (
                    <span />
                  )}
                  <span>{formatDistance(step.distanceMeters)}</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default TurnByTurnPanel;
