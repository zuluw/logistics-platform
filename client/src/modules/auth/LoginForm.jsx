import { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { Eye, EyeOff } from 'lucide-react';

export function LoginForm({ onForgotModeChange }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const [isForgot, setIsForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

  const handleToggleForgot = (mode) => {
    setIsForgot(mode);
    setError(null);
    setForgotSent(false);
    if (onForgotModeChange) {
      onForgotModeChange(mode);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await login(email.trim(), password);
    } catch (err) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotSubmit = (e) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setForgotLoading(true);
    setTimeout(() => {
      setForgotLoading(false);
      setForgotSent(true);
    }, 600);
  };

  if (isForgot) {
    return (
      <div className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-sm font-semibold text-zinc-900">Reset password</h2>
          <p className="text-xs text-zinc-500">
            Enter your account email to receive recovery instructions.
          </p>
        </div>

        {forgotSent ? (
          <div className="space-y-4">
            <div className="rounded-lg bg-zinc-100 border border-zinc-200 p-3 text-xs text-zinc-700 leading-relaxed">
              Recovery link has been dispatched to <span className="font-semibold text-zinc-900">{forgotEmail}</span>
            </div>
            <button
              type="button"
              onClick={() => handleToggleForgot(false)}
              className="w-full bg-zinc-900 hover:bg-zinc-800 text-white py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer"
            >
              Back to sign in
            </button>
          </div>
        ) : (
          <form onSubmit={handleForgotSubmit} className="space-y-3.5">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-zinc-700">
                Email
              </label>
              <input
                type="email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                placeholder="name@company.com"
                required
                autoComplete="email"
                className="w-full bg-white border border-zinc-300 rounded-lg px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={forgotLoading}
              className="w-full bg-zinc-900 hover:bg-zinc-800 text-white py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {forgotLoading ? 'Sending...' : 'Send recovery link'}
            </button>

            <button
              type="button"
              onClick={() => handleToggleForgot(false)}
              className="w-full text-center text-xs text-zinc-500 hover:text-zinc-900 py-1 cursor-pointer"
            >
              Back to sign in
            </button>
          </form>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3.5">
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-2.5 text-xs text-red-700">
          {error}
        </div>
      )}

      <div className="space-y-1">
        <label className="block text-xs font-medium text-zinc-700">
          Email
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="name@company.com"
          required
          autoComplete="email"
          className="w-full bg-white border border-zinc-300 rounded-lg px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors"
        />
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-medium text-zinc-700">
            Password
          </label>
          <button
            type="button"
            onClick={() => handleToggleForgot(true)}
            className="text-xs text-zinc-500 hover:text-zinc-900 cursor-pointer"
          >
            Forgot password?
          </button>
        </div>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            autoComplete="current-password"
            className="w-full bg-white border border-zinc-300 rounded-lg px-3 py-2 pr-9 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 cursor-pointer"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-zinc-900 hover:bg-zinc-800 text-white py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer mt-1"
      >
        {isLoading ? 'Signing in...' : 'Sign In'}
      </button>
    </form>
  );
}

export default LoginForm;
