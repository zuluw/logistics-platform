import { useState, useEffect, useRef } from 'react';
import {
  Route,
  ArrowRight,
  Truck,
  Building2,
  CheckCircle2,
  ChevronRight,
  Workflow
} from 'lucide-react';
import { RouteTimelineTrack } from './TruckIllustration.jsx';
import { apiClient } from '../../api/client.js';

export function LandingPage({ onOpenAuth }) {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [metrics, setMetrics] = useState({
    fuelSavingsPercent: 24,
    onTimeDeliveryRate: '99.4',
    totalDistanceKm: '1,280',
    activeFleetsCount: 12,
  });

  const trackRef = useRef(null);

  useEffect(() => {
    let isMounted = true;
    apiClient
      .get('/analytics/summary')
      .then((data) => {
        if (isMounted && data) {
          setMetrics((prev) => ({
            ...prev,
            ...data,
          }));
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (!trackRef.current) return;
      const rect = trackRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const totalHeight = rect.height;
      const startOffset = viewportHeight * 0.7;
      const distance = startOffset - rect.top;
      const progress = Math.min(Math.max((distance / totalHeight) * 100, 0), 100);
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 relative overflow-hidden font-sans select-none">
      <div
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          backgroundImage: `
            linear-gradient(to right, #e4e4e7 1px, transparent 1px),
            linear-gradient(to bottom, #e4e4e7 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
          maskImage: 'radial-gradient(ellipse at center, rgba(0,0,0,1) 25%, rgba(0,0,0,0.1) 85%)',
          WebkitMaskImage: 'radial-gradient(ellipse at center, rgba(0,0,0,1) 25%, rgba(0,0,0,0.1) 85%)',
        }}
      />

      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[800px] h-[450px] bg-gradient-to-b from-blue-100/50 via-zinc-200/30 to-transparent rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-[450px] -left-32 w-[550px] h-[550px] bg-indigo-100/35 rounded-full blur-[110px] pointer-events-none" />
      <div className="absolute top-[1100px] -right-32 w-[600px] h-[600px] bg-blue-100/30 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-40 left-1/4 w-[650px] h-[650px] bg-zinc-200/40 rounded-full blur-[120px] pointer-events-none" />

      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-white/80 border-b border-zinc-200/80 px-6 sm:px-8 py-3.5 flex justify-between items-center transition-all">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-zinc-900 text-white flex items-center justify-center shadow-xs">
            <Route className="h-4 w-4" />
          </div>
          <span className="text-base font-semibold text-zinc-900 tracking-tight">
            Logistics Platform
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => onOpenAuth('signin')}
            className="px-3.5 py-1.5 text-sm font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100/80 rounded-lg transition-colors cursor-pointer"
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => onOpenAuth('register')}
            className="bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            <span>Register</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </header>

      <main className="pt-28 sm:pt-36 pb-20 relative z-10">
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-zinc-900 max-w-4xl mx-auto leading-[1.14]">
            Automated Route Planning and Fleet Delivery Management
          </h1>

          <p className="mt-5 text-base sm:text-lg text-zinc-600 max-w-2xl mx-auto leading-relaxed">
            Centralized dispatch platform designed to optimize urban delivery routes, reduce fuel costs, and track order completion across commercial transport networks.
          </p>

          <div className="mt-8 flex justify-center">
            <button
              type="button"
              onClick={() => onOpenAuth('register')}
              className="bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg px-6 py-3 text-sm font-medium transition-colors shadow-sm cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Get Started</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto pt-8 border-t border-zinc-200/80">
            <div className="p-4 bg-white/70 border border-zinc-200/80 rounded-xl backdrop-blur-xs shadow-xs">
              <div className="text-2xl sm:text-3xl font-bold text-zinc-900 tracking-tight">
                -{metrics.fuelSavingsPercent}%
              </div>
              <div className="text-xs text-zinc-500 mt-1 font-medium">Fuel Consumption Reduction</div>
            </div>
            <div className="p-4 bg-white/70 border border-zinc-200/80 rounded-xl backdrop-blur-xs shadow-xs">
              <div className="text-2xl sm:text-3xl font-bold text-zinc-900 tracking-tight">
                {metrics.onTimeDeliveryRate}%
              </div>
              <div className="text-xs text-zinc-500 mt-1 font-medium">On-Time Delivery Rate</div>
            </div>
            <div className="p-4 bg-white/70 border border-zinc-200/80 rounded-xl backdrop-blur-xs shadow-xs">
              <div className="text-2xl sm:text-3xl font-bold text-zinc-900 tracking-tight">
                {metrics.totalDistanceKm} km
              </div>
              <div className="text-xs text-zinc-500 mt-1 font-medium">Optimized Road Mileage</div>
            </div>
          </div>
        </section>

        <section ref={trackRef} className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-24 sm:mt-32">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-zinc-100 text-zinc-800 border border-zinc-200 mb-3">
              <Workflow className="w-3.5 h-3.5 text-zinc-900" />
              <span>Operational Workflow</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900">
              Interactive Route Execution Track
            </h2>
            <p className="text-xs sm:text-sm text-zinc-500 mt-2">
              Follow the automated dispatch lifecycle from departure depot to the final handover point.
            </p>
          </div>

          <RouteTimelineTrack scrollProgress={scrollProgress} />
        </section>

        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-24 sm:mt-32">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900">
              Role-Optimized Workspaces
            </h2>
            <p className="text-xs sm:text-sm text-zinc-500 mt-2">
              Tailored operating environments for centralized dispatchers and frontline drivers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-zinc-200 rounded-xl p-7 shadow-xs hover:border-zinc-300 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-900 mb-4">
                <Building2 className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-zinc-900 mb-2">Dispatcher Control Center</h3>
              <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed mb-5">
                Full spatial awareness with an interactive dispatch map, depot and customer order visualizers, one-click automated route optimization, and live driver fleet telemetry.
              </p>
              <ul className="space-y-2 text-xs text-zinc-600 border-t border-zinc-100 pt-4">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-zinc-900 shrink-0" />
                  <span>Real-time delivery trajectory display</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-zinc-900 shrink-0" />
                  <span>Automated payload distribution engine</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-zinc-900 shrink-0" />
                  <span>Interactive order staging and status filters</span>
                </li>
              </ul>
            </div>

            <div className="bg-white border border-zinc-200 rounded-xl p-7 shadow-xs hover:border-zinc-300 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-900 mb-4">
                <Truck className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-zinc-900 mb-2">Driver Mobile Terminal</h3>
              <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed mb-5">
                Streamlined mobile-first terminal for drivers on the road. Sequential stop cards, direct phone customer contact links, and immediate one-tap delivery confirmations.
              </p>
              <ul className="space-y-2 text-xs text-zinc-600 border-t border-zinc-100 pt-4">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-zinc-900 shrink-0" />
                  <span>Sequential route stop navigation</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-zinc-900 shrink-0" />
                  <span>Instant status transitions for transit and handover</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-zinc-900 shrink-0" />
                  <span>Direct phone calling and cargo verification</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        <section className="max-w-4xl mx-auto px-4 sm:px-6 mt-24 sm:mt-32">
          <div className="bg-white border border-zinc-200 rounded-2xl p-8 sm:p-12 text-center shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-zinc-100 rounded-full blur-2xl -z-10" />
            <h2 className="text-2xl sm:text-3xl font-bold text-zinc-900 tracking-tight">
              Ready to streamline delivery logistics?
            </h2>
            <p className="text-xs sm:text-sm text-zinc-600 max-w-xl mx-auto mt-3 leading-relaxed">
              Experience algorithmic route planning, rigorous vehicle capacity control, and continuous real-time synchronization.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => onOpenAuth('register')}
                className="w-full sm:w-auto bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg px-6 py-3 text-sm font-medium transition-colors shadow-sm cursor-pointer"
              >
                Create Account
              </button>
              <button
                type="button"
                onClick={() => onOpenAuth('signin')}
                className="w-full sm:w-auto bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-900 rounded-lg px-6 py-3 text-sm font-medium transition-colors shadow-xs cursor-pointer"
              >
                Sign In
              </button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-zinc-200/80 bg-white/60 py-8 px-6 sm:px-8 text-center text-xs text-zinc-500">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Route className="h-4 w-4 text-zinc-900" />
            <span className="font-semibold text-zinc-900">Logistics Platform</span>
          </div>
          <div>
            Enterprise Transport Logistics and Commercial Fleet Management
          </div>
          <div>
            © 2026 All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
