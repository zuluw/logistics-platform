import { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import { LoginForm } from './LoginForm.jsx';
import { RegisterForm } from './RegisterForm.jsx';
import { Route, ArrowLeft } from 'lucide-react';

export function AuthPage({ initialTab = 'signin', onBack }) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [isForgotMode, setIsForgotMode] = useState(false);
  const mapContainerRef = useRef(null);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [53.90, 27.56],
      zoom: 5,
      zoomControl: false,
      attributionControl: false,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      boxZoom: false,
      keyboard: false,
      touchZoom: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
    }).addTo(map);

    const routes = [
      [
        [53.90, 27.56],
        [52.52, 13.40],
        [51.50, -0.12],
      ],
      [
        [40.71, -74.00],
        [41.87, -87.62],
        [34.05, -118.24],
      ],
      [
        [31.23, 121.47],
        [25.20, 55.27],
        [53.90, 27.56],
      ],
      [
        [55.75, 37.61],
        [53.90, 27.56],
        [52.23, 21.01],
        [50.85, 4.35],
      ],
    ];

    routes.forEach((route) => {
      L.polyline(route, {
        color: '#6366f1',
        weight: 2,
        opacity: 0.4,
        dashArray: '4, 8',
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map);

      route.forEach(([lat, lng]) => {
        L.circleMarker([lat, lng], {
          radius: 3,
          color: '#6366f1',
          fillColor: '#ffffff',
          fillOpacity: 0.8,
          weight: 1.5,
        }).addTo(map);
      });
    });

    const getInterpolatedPoint = (points, progress) => {
      const segments = points.length - 1;
      const scaled = progress * segments;
      const index = Math.min(Math.floor(scaled), segments - 1);
      const t = scaled - index;
      const p1 = points[index];
      const p2 = points[index + 1];
      const lat = p1[0] + (p2[0] - p1[0]) * t;
      const lng = p1[1] + (p2[1] - p1[1]) * t;
      return [lat, lng];
    };

    const pulseMarkers = routes.map((route, i) => {
      const initialPoint = route[0];
      return {
        marker: L.circleMarker(initialPoint, {
          radius: 4,
          color: '#3b82f6',
          fillColor: '#60a5fa',
          fillOpacity: 0.9,
          weight: 1,
        }).addTo(map),
        progress: (i * 0.25) % 1,
        speed: 0.0016 + (i % 2) * 0.0004,
      };
    });

    let animationFrameId;
    const animatePulses = () => {
      pulseMarkers.forEach((item, i) => {
        item.progress = (item.progress + item.speed) % 1;
        const pos = getInterpolatedPoint(routes[i], item.progress);
        item.marker.setLatLng(pos);
      });
      animationFrameId = requestAnimationFrame(animatePulses);
    };
    animationFrameId = requestAnimationFrame(animatePulses);

    const regions = [
      { coords: [53.90, 27.56], zoom: 5 },
      { coords: [39.82, -98.57], zoom: 4 },
      { coords: [35.86, 104.19], zoom: 4 },
    ];
    let currentRegionIndex = 0;

    const flyInterval = setInterval(() => {
      currentRegionIndex = (currentRegionIndex + 1) % regions.length;
      const target = regions[currentRegionIndex];
      map.flyTo(target.coords, target.zoom, {
        duration: 18,
        easeLinearity: 0.25,
      });
    }, 20000);

    return () => {
      cancelAnimationFrame(animationFrameId);
      clearInterval(flyInterval);
      map.remove();
    };
  }, []);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setIsForgotMode(false);
  };

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-zinc-50 relative overflow-hidden select-none">
      <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0">
        <div
          ref={mapContainerRef}
          className="w-full h-full blur-[1.5px] opacity-50 scale-105 pointer-events-none"
        />
        <div className="absolute inset-0 bg-zinc-50/60 backdrop-blur-[1px] pointer-events-none" />
      </div>

      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="absolute top-6 left-6 z-20 text-zinc-600 hover:text-zinc-900 hover:bg-white/80 rounded-lg px-3 py-1.5 text-sm font-medium transition-all flex items-center gap-2 border border-zinc-200/60 bg-white/50 backdrop-blur-sm cursor-pointer shadow-xs"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to home</span>
        </button>
      )}

      <div className="bg-white/95 backdrop-blur-md border border-zinc-200 rounded-xl p-8 max-w-[400px] w-full shadow-lg shadow-zinc-200/60 relative z-10 mx-4">
        <div className="flex items-center justify-center gap-2.5 mb-6">
          <Route className="h-[22px] w-[22px] text-zinc-900" />
          <span className="text-lg font-semibold text-zinc-900">
            Logistics Platform
          </span>
        </div>

        {!isForgotMode && (
          <div className="flex bg-zinc-100 p-1 rounded-lg text-xs font-medium mb-6">
            <button
              type="button"
              onClick={() => handleTabChange('signin')}
              className={`flex-1 py-1.5 rounded-md transition-all cursor-pointer ${
                activeTab === 'signin'
                  ? 'bg-white text-zinc-900 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('register')}
              className={`flex-1 py-1.5 rounded-md transition-all cursor-pointer ${
                activeTab === 'register'
                  ? 'bg-white text-zinc-900 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              Register
            </button>
          </div>
        )}

        {activeTab === 'signin' ? (
          <LoginForm onForgotModeChange={setIsForgotMode} />
        ) : (
          <RegisterForm />
        )}
      </div>

      <footer className="absolute bottom-4 left-0 right-0 text-center text-xs text-zinc-400 z-20 pointer-events-none">
        © 2026 Logistics Platform
      </footer>
    </div>
  );
}

export default AuthPage;
