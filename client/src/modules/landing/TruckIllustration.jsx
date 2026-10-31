import {
  Route,
  ShieldCheck,
  Radio,
  Building2,
  CheckCircle2,
  MapPin,
  Scale,
  Truck,
  Activity,
  Users
} from 'lucide-react';

export function RouteTimelineTrack({ scrollProgress = 0 }) {
  const isStep1Active = scrollProgress >= 18;
  const isStep2Active = scrollProgress >= 48;
  const isStep3Active = scrollProgress >= 78;
  const isFinished = scrollProgress >= 95;

  const progressLineHeight = Math.min(Math.max((scrollProgress - 5) * 1.1, 0), 100);

  return (
    <div className="relative py-6 select-none">
      <div className="w-0.5 bg-zinc-200 absolute top-12 bottom-12 left-6 md:left-1/2 -translate-x-1/2" />
      <div
        className="w-0.5 bg-zinc-900 absolute top-12 left-6 md:left-1/2 -translate-x-1/2 transition-all duration-150 ease-out"
        style={{ height: `${progressLineHeight}%` }}
      />

      <div className="flex items-center justify-center mb-16">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-zinc-200 text-xs font-semibold text-zinc-800 shadow-xs z-10">
          <Building2 className="w-3.5 h-3.5 text-zinc-900" />
          <span>Depot Origin</span>
        </div>
      </div>

      <div className="space-y-16 sm:space-y-28">
        <div className="relative flex flex-col md:flex-row items-center justify-between">
          <div className="w-full md:w-[44%] md:mr-auto pl-16 md:pl-0 md:mr-12">
            <div
              className={`bg-white rounded-xl p-6 sm:p-7 shadow-xs transition-all duration-300 ${
                isStep1Active
                  ? 'border border-zinc-300/80 shadow-md ring-1 ring-zinc-900/5'
                  : 'border border-zinc-200'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-lg bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-900">
                  <Route className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-mono text-zinc-400 font-medium">STEP 01</span>
              </div>

              <h3 className="text-lg sm:text-xl font-bold tracking-tight text-zinc-900 mb-2">
                Smart Route Optimization
              </h3>
              <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed mb-4">
                Calculates shortest driving routes across city networks to reduce mileage, avoid detours, and minimize transit delays.
              </p>

              <div className="flex flex-wrap gap-2 pt-2 border-t border-zinc-100">
                <div className="flex items-center gap-1.5 text-xs text-zinc-700 bg-zinc-50 border border-zinc-200 px-2.5 py-1 rounded-md">
                  <Route className="w-3 h-3 text-zinc-900" />
                  <span>Shortest Path Routing</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-zinc-700 bg-zinc-50 border border-zinc-200 px-2.5 py-1 rounded-md">
                  <MapPin className="w-3 h-3 text-zinc-900" />
                  <span>Urban Network Coverage</span>
                </div>
              </div>
            </div>
          </div>

          <div
            className={`absolute left-6 md:left-1/2 -translate-x-1/2 top-6 md:top-1/2 md:-translate-y-1/2 w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-semibold z-20 ${
              isStep1Active
                ? 'bg-zinc-900 border-zinc-900 text-white shadow-md shadow-zinc-900/20 scale-110 transition-all duration-300'
                : 'border-zinc-300 text-zinc-400 bg-white transition-all duration-300'
            }`}
          >
            1
          </div>

          <div className="hidden md:block w-[44%]" />
        </div>

        <div className="relative flex flex-col md:flex-row items-center justify-between">
          <div className="hidden md:block w-[44%]" />

          <div
            className={`absolute left-6 md:left-1/2 -translate-x-1/2 top-6 md:top-1/2 md:-translate-y-1/2 w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-semibold z-20 ${
              isStep2Active
                ? 'bg-zinc-900 border-zinc-900 text-white shadow-md shadow-zinc-900/20 scale-110 transition-all duration-300'
                : 'border-zinc-300 text-zinc-400 bg-white transition-all duration-300'
            }`}
          >
            2
          </div>

          <div className="w-full md:w-[44%] md:ml-auto pl-16 md:pl-0 md:ml-12">
            <div
              className={`bg-white rounded-xl p-6 sm:p-7 shadow-xs transition-all duration-300 ${
                isStep2Active
                  ? 'border border-zinc-300/80 shadow-md ring-1 ring-zinc-900/5'
                  : 'border border-zinc-200'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-lg bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-900">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-mono text-zinc-400 font-medium">STEP 02</span>
              </div>

              <h3 className="text-lg sm:text-xl font-bold tracking-tight text-zinc-900 mb-2">
                Payload and Fleet Allocation
              </h3>
              <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed mb-4">
                Distributes delivery orders according to vehicle payload capacity and cargo volume to ensure balanced truck loading.
              </p>

              <div className="flex flex-wrap gap-2 pt-2 border-t border-zinc-100">
                <div className="flex items-center gap-1.5 text-xs text-zinc-700 bg-zinc-50 border border-zinc-200 px-2.5 py-1 rounded-md">
                  <Scale className="w-3 h-3 text-zinc-900" />
                  <span>Weight and Volume Control</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-zinc-700 bg-zinc-50 border border-zinc-200 px-2.5 py-1 rounded-md">
                  <Truck className="w-3 h-3 text-zinc-900" />
                  <span>Balanced Vehicle Loading</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative flex flex-col md:flex-row items-center justify-between">
          <div className="w-full md:w-[44%] md:mr-auto pl-16 md:pl-0 md:mr-12">
            <div
              className={`bg-white rounded-xl p-6 sm:p-7 shadow-xs transition-all duration-300 ${
                isStep3Active
                  ? 'border border-zinc-300/80 shadow-md ring-1 ring-zinc-900/5'
                  : 'border border-zinc-200'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-lg bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-900">
                  <Radio className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-mono text-zinc-400 font-medium">STEP 03</span>
              </div>

              <h3 className="text-lg sm:text-xl font-bold tracking-tight text-zinc-900 mb-2">
                Live Status Synchronization
              </h3>
              <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed mb-4">
                Provides continuous communication between dispatchers and drivers with instant delivery confirmations and proof of handover.
              </p>

              <div className="flex flex-wrap gap-2 pt-2 border-t border-zinc-100">
                <div className="flex items-center gap-1.5 text-xs text-zinc-700 bg-zinc-50 border border-zinc-200 px-2.5 py-1 rounded-md">
                  <Activity className="w-3 h-3 text-zinc-900" />
                  <span>Instant Status Updates</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-zinc-700 bg-zinc-50 border border-zinc-200 px-2.5 py-1 rounded-md">
                  <Users className="w-3 h-3 text-zinc-900" />
                  <span>Proof of Handover</span>
                </div>
              </div>
            </div>
          </div>

          <div
            className={`absolute left-6 md:left-1/2 -translate-x-1/2 top-6 md:top-1/2 md:-translate-y-1/2 w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-semibold z-20 ${
              isStep3Active
                ? 'bg-zinc-900 border-zinc-900 text-white shadow-md shadow-zinc-900/20 scale-110 transition-all duration-300'
                : 'border-zinc-300 text-zinc-400 bg-white transition-all duration-300'
            }`}
          >
            3
          </div>

          <div className="hidden md:block w-[44%]" />
        </div>
      </div>

      <div className="flex items-center justify-center mt-16">
        <div
          className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold shadow-xs z-10 transition-all duration-300 ${
            isFinished
              ? 'bg-zinc-900 text-white border border-zinc-900'
              : 'bg-white border border-zinc-200 text-zinc-800'
          }`}
        >
          <CheckCircle2
            className={`w-3.5 h-3.5 ${
              isFinished ? 'text-emerald-400' : 'text-emerald-600'
            }`}
          />
          <span>Delivery Completed</span>
        </div>
      </div>
    </div>
  );
}

export const TruckIllustration = RouteTimelineTrack;
export default RouteTimelineTrack;
