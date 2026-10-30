import { useState } from 'react';
import { Card } from '../../components/index.js';
import { LoginForm } from './LoginForm.jsx';
import { RegisterForm } from './RegisterForm.jsx';
import { Truck } from 'lucide-react';

export function AuthPage() {
  const [isRegister, setIsRegister] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-600 text-white shadow-md mb-3">
            <Truck className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Logistics Platform
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Automated route planning and delivery operations
          </p>
        </div>

        <Card
          title={isRegister ? 'Create an Account' : 'Welcome Back'}
          subtitle={
            isRegister
              ? 'Register a new dispatcher or driver account'
              : 'Enter your credentials to access the platform'
          }
        >
          {isRegister ? (
            <RegisterForm onSwitchToLogin={() => setIsRegister(false)} />
          ) : (
            <LoginForm onSwitchToRegister={() => setIsRegister(true)} />
          )}
        </Card>
      </div>
    </div>
  );
}

export default AuthPage;
