import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { SocketProvider } from './context/SocketContext.jsx';
import { LogisticsProvider } from './context/LogisticsContext.jsx';
import { LandingPage } from './modules/landing/LandingPage.jsx';
import { AuthPage } from './modules/auth/AuthPage.jsx';
import { DispatcherDashboard } from './modules/dispatcher/DispatcherDashboard.jsx';
import { DriverDashboard } from './modules/driver/DriverDashboard.jsx';
import { AdminDashboard } from './modules/admin/AdminDashboard.jsx';

function getResetTokenFromUrl() {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');
  const isResetPath = window.location.pathname.includes('/reset-password');
  if (token || isResetPath) {
    return token || '';
  }
  return null;
}

function MainApp() {
  const { isAuthenticated, isLoading, isDispatcher, isDriver, isAdmin } = useAuth();
  const [authMode, setAuthMode] = useState(null);
  const [resetToken, setResetToken] = useState(getResetTokenFromUrl);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-zinc-900 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-medium text-zinc-500">Loading Logistics Platform...</p>
        </div>
      </div>
    );
  }

  if (resetToken !== null) {
    return (
      <AuthPage
        initialTab="reset"
        resetToken={resetToken}
        onResetComplete={() => {
          setResetToken(null);
          setAuthMode('signin');
          if (typeof window !== 'undefined' && window.history.replaceState) {
            window.history.replaceState({}, '', '/');
          }
        }}
        onBack={() => {
          setResetToken(null);
          setAuthMode(null);
          if (typeof window !== 'undefined' && window.history.replaceState) {
            window.history.replaceState({}, '', '/');
          }
        }}
      />
    );
  }

  if (!isAuthenticated) {
    if (authMode) {
      return (
        <AuthPage
          initialTab={authMode}
          onBack={() => setAuthMode(null)}
        />
      );
    }
    return (
      <LandingPage
        onOpenAuth={(mode) => setAuthMode(mode || 'signin')}
      />
    );
  }

  if (isAdmin) {
    return <AdminDashboard />;
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
