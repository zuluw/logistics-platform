import { useAuth } from '../../context/AuthContext.jsx';
import { useSocket } from '../../context/SocketContext.jsx';
import { useLogistics } from '../../context/LogisticsContext.jsx';
import { Button, Card } from '../../components/index.js';
import { Truck, LogOut, CheckCircle, Navigation, MapPin } from 'lucide-react';

export function DriverDashboard() {
  const { user, logout } = useAuth();
  const { isConnected } = useSocket();
  const { activeRoute, updatePointStatus } = useLogistics();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-900 leading-tight">Driver Workspace</h1>
              <p className="text-xs text-slate-500">{user?.fullName}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div
              className={`w-2.5 h-2.5 rounded-full ${
                isConnected ? 'bg-emerald-500' : 'bg-amber-400'
              }`}
              title={isConnected ? 'Connected' : 'Disconnected'}
            />
            <Button variant="ghost" size="sm" onClick={logout} title="Sign Out">
              <LogOut className="h-4 w-4 text-slate-500" />
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-md w-full mx-auto p-4 space-y-4">
        {activeRoute ? (
          <div className="space-y-4">
            <Card
              title="Active Waybill"
              subtitle={`Distance: ${activeRoute.totalDistanceKm} km • Est. Duration: ${activeRoute.totalDurationMin} min`}
            >
              <div className="space-y-3">
                <div className="text-xs text-slate-500">
                  Vehicle: <span className="font-semibold text-slate-800">{activeRoute.vehicle?.brand} ({activeRoute.vehicle?.licensePlate})</span>
                </div>

                <div className="divide-y divide-slate-100">
                  {activeRoute.routePoints?.map((point) => (
                    <div key={point.id} className="py-3 flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-700 text-xs font-bold shrink-0 mt-0.5">
                          {point.stopSequence}
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {point.order?.customerName}
                          </p>
                          <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                            <MapPin className="h-3 w-3 text-slate-400" />
                            {point.order?.deliveryAddress}
                          </p>
                          <p className="text-xs text-slate-400 mt-1">
                            Status: <span className="font-medium text-slate-600">{point.order?.status}</span>
                          </p>
                        </div>
                      </div>

                      {point.order?.status !== 'DELIVERED' && (
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => updatePointStatus(activeRoute.id, point.id, 'DELIVERED')}
                        >
                          <CheckCircle className="h-3.5 w-3.5 mr-1" />
                          Done
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        ) : (
          <Card className="text-center py-12">
            <Navigation className="h-10 w-10 mx-auto text-slate-300 mb-3" />
            <h3 className="text-base font-semibold text-slate-800">No Active Route</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
              You currently have no routes assigned. When a dispatcher assigns a route, it will automatically appear here.
            </p>
          </Card>
        )}
      </main>
    </div>
  );
}

export default DriverDashboard;
