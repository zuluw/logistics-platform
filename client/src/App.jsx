import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { SocketProvider } from './context/SocketContext.jsx';
import { LogisticsProvider } from './context/LogisticsContext.jsx';
import { AuthPage } from './modules/auth/AuthPage.jsx';
import { DispatcherDashboard } from './modules/dispatcher/DispatcherDashboard.jsx';
import { DriverDashboard } from './modules/driver/DriverDashboard.jsx';

function MainApp() {
  const { isAuthenticated, isLoading, isDispatcher, isDriver } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-medium text-slate-500">Loading Logistics Platform...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  if (isDriver) {
    return <DriverDashboard />;
  }

  if (isDispatcher) {
    return <DispatcherDashboard />;
  }

  return <DispatcherDashboard />;
}

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <LogisticsProvider>
          <MainApp />
        </LogisticsProvider>
      </SocketProvider>
    </AuthProvider>
  );
}
