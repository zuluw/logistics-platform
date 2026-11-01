import { useState } from 'react';
import { Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { apiClient } from '../../api/client.js';

export function ResetPasswordForm({ token, onBackToLogin }) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError('Reset token is missing or invalid. Please request a new link.');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);

    try {
      await apiClient.post('/auth/reset-password', {
        token,
        newPassword,
      });

      setIsSuccess(true);
      setTimeout(() => {
        if (onBackToLogin) {
          onBackToLogin();
        }
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to update password. The link may have expired.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-sm font-semibold text-zinc-900">Set new password</h2>
        <p className="text-xs text-zinc-500">
          Please enter your new corporate password
        </p>
      </div>

      {isSuccess ? (
        <div className="space-y-4">
          <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3.5 text-xs text-emerald-800 leading-relaxed font-medium flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>Password successfully updated! You can now sign in.</span>
          </div>
          <button
            type="button"
            onClick={onBackToLogin}
            className="w-full bg-zinc-900 hover:bg-zinc-800 text-white py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer shadow-xs"
          >
            Sign in
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {error && (
            <div className="rounded-lg bg-rose-50 border border-rose-200 p-2.5 text-xs text-rose-700">
              {error}
            </div>
          )}

          <div className="space-y-1">
            <label className="block text-xs font-medium text-zinc-700">
              New Password
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="w-full bg-white border border-zinc-300 rounded-lg px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors pr-10"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 cursor-pointer"
              >
                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-medium text-zinc-700">
              Confirm Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="w-full bg-white border border-zinc-300 rounded-lg px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 cursor-pointer"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-zinc-900 hover:bg-zinc-800 text-white py-2.5 rounded-lg text-sm font-medium transition-colors shadow-xs disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer mt-1"
          >
            {isLoading ? 'Updating password...' : 'Update Password'}
          </button>

          <button
            type="button"
            onClick={onBackToLogin}
            className="w-full text-center text-xs text-zinc-500 hover:text-zinc-900 py-1 cursor-pointer"
          >
            Back to sign in
          </button>
        </form>
      )}
    </div>
  );
}
