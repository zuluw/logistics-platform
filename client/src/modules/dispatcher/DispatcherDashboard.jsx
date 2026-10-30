import { useAuth } from '../../context/AuthContext.jsx';
import { useSocket } from '../../context/SocketContext.jsx';
import { useLogistics } from '../../context/LogisticsContext.jsx';
import { Button, Card } from '../../components/index.js';
import { Truck, Package, MapPin, RefreshCw, LogOut, Wifi, WifiOff } from 'lucide-react';

export function DispatcherDashboard() {
  const { user, logout } = useAuth();
  const { isConnected } = useSocket();
  const { orders, vehicles, routes, isLoading, refreshAll } = useLogistics();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 leading-tight">
                Logistics Dispatcher
              </h1>
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <span>{user?.fullName}</span>
                <span>•</span>
                <span className="font-medium text-indigo-600">{user?.role}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                isConnected
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}
            >
              {isConnected ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
              <span>{isConnected ? 'Realtime Connected' : 'Disconnected'}</span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={refreshAll}
              isLoading={isLoading}
              title="Refresh Data"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>

            <Button variant="ghost" size="sm" onClick={logout} title="Sign Out">
              <LogOut className="h-4 w-4 text-slate-500" />
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Card className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Package className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider font-semibold text-slate-500">Orders</p>
              <p className="text-2xl font-bold text-slate-900">{orders.length}</p>
            </div>
          </Card>

          <Card className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Truck className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider font-semibold text-slate-500">Vehicles</p>
              <p className="text-2xl font-bold text-slate-900">{vehicles.length}</p>
            </div>
          </Card>

          <Card className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <MapPin className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider font-semibold text-slate-500">Routes</p>
              <p className="text-2xl font-bold text-slate-900">{routes.length}</p>
            </div>
          </Card>
        </div>

        <Card
          title="Interactive Map & Route Planning"
          subtitle="Real-time map and route dispatch operations"
        >
          <div className="h-96 rounded-lg bg-slate-100 border border-slate-200 flex flex-col items-center justify-center text-slate-400 p-6 text-center">
            <MapPin className="h-10 w-10 mb-2 text-slate-400" />
            <p className="text-sm font-medium text-slate-600">Map Container Ready</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              Leaflet integration and interactive map controls are prepared for delivery tracking and routing.
            </p>
          </div>
        </Card>
      </main>
    </div>
  );
}

export default DispatcherDashboard;
