import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { apiClient } from '../api/client.js';
import {
  X,
  CheckCircle2,
  Route,
  Truck,
  Package,
  MapPin,
  Eye,
  EyeOff,
  AlertCircle
} from 'lucide-react';

export function ProfileModal({ isOpen, onClose }) {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  const [stats, setStats] = useState(null);
  const [isStatsLoading, setIsStatsLoading] = useState(false);

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState(null);
  const [profileError, setProfileError] = useState(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState(null);
  const [passwordError, setPasswordError] = useState(null);

  useEffect(() => {
    if (user) {
      setFullName(user.fullName || '');
      setPhone(user.phone || '');
    }
  }, [user]);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setIsStatsLoading(true);

    apiClient
      .get('/auth/stats')
      .then((data) => {
        if (isMounted) setStats(data);
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setIsStatsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const initials = user?.fullName
    ? user.fullName
        .split(' ')
        .filter(Boolean)
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U';

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileError(null);
    setProfileMessage(null);
    setIsUpdatingProfile(true);

    try {
      const updated = await apiClient.patch('/auth/profile', {
        fullName: fullName.trim(),
        phone: phone ? phone.trim() : null,
      });
      updateUser(updated);
      setProfileMessage('Profile details updated successfully');
    } catch (err) {
      setProfileError(err.message || 'Failed to update profile details');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordMessage(null);

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    setIsUpdatingPassword(true);

    try {
      await apiClient.post('/auth/change-password', {
        currentPassword,
        newPassword,
      });
      setPasswordMessage('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordError(err.message || 'Failed to update password');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-xs select-none">
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full max-w-lg bg-white rounded-xl shadow-xl border border-zinc-200 overflow-hidden z-10 flex flex-col">
        <div className="flex items-center justify-between border-b border-zinc-100 p-5">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-full bg-zinc-900 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
              {initials}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-zinc-900 leading-tight">
                  {user?.fullName}
                </h3>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide uppercase bg-zinc-100 text-zinc-800 border border-zinc-200">
                  {user?.role}
                </span>
              </div>
              <p className="text-xs text-zinc-500 mt-0.5">{user?.email}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5">
          <div className="flex bg-zinc-100 p-1 rounded-lg text-xs font-medium mb-5">
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`flex-1 py-1.5 rounded-md transition-all cursor-pointer ${
                activeTab === 'overview'
                  ? 'bg-white text-zinc-900 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              Overview
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('details')}
              className={`flex-1 py-1.5 rounded-md transition-all cursor-pointer ${
                activeTab === 'details'
                  ? 'bg-white text-zinc-900 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              Edit Details
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('security')}
              className={`flex-1 py-1.5 rounded-md transition-all cursor-pointer ${
                activeTab === 'security'
                  ? 'bg-white text-zinc-900 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              Security
            </button>
          </div>

          {activeTab === 'overview' && (
            <div className="space-y-4">
              {isStatsLoading ? (
                <div className="py-8 flex flex-col items-center justify-center gap-2">
                  <div className="w-6 h-6 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs text-zinc-500">Loading performance stats...</span>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {user?.role === 'DRIVER' ? (
                    <>
                      <div className="p-3.5 rounded-lg border border-zinc-200 bg-zinc-50/60">
                        <div className="flex items-center gap-1.5 text-zinc-500 text-xs font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5 text-zinc-700" />
                          <span>Delivered Orders</span>
                        </div>
                        <div className="text-xl font-bold text-zinc-900 mt-1">
                          {stats?.deliveredOrdersCount ?? 0}
                        </div>
                      </div>
                      <div className="p-3.5 rounded-lg border border-zinc-200 bg-zinc-50/60">
                        <div className="flex items-center gap-1.5 text-zinc-500 text-xs font-medium">
                          <Truck className="w-3.5 h-3.5 text-zinc-700" />
                          <span>Completed Routes</span>
                        </div>
                        <div className="text-xl font-bold text-zinc-900 mt-1">
                          {stats?.completedRoutesCount ?? 0}
                        </div>
                      </div>
                      <div className="p-3.5 rounded-lg border border-zinc-200 bg-zinc-50/60">
                        <div className="flex items-center gap-1.5 text-zinc-500 text-xs font-medium">
                          <Route className="w-3.5 h-3.5 text-zinc-700" />
                          <span>Total Distance</span>
                        </div>
                        <div className="text-xl font-bold text-zinc-900 mt-1">
                          {stats?.totalDistanceKm ?? 0} km
                        </div>
                      </div>
                      <div className="p-3.5 rounded-lg border border-zinc-200 bg-zinc-50/60">
                        <div className="flex items-center gap-1.5 text-zinc-500 text-xs font-medium">
                          <MapPin className="w-3.5 h-3.5 text-zinc-700" />
                          <span>Assigned Routes</span>
                        </div>
                        <div className="text-xl font-bold text-zinc-900 mt-1">
                          {stats?.totalRoutesCount ?? 0}
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="p-3.5 rounded-lg border border-zinc-200 bg-zinc-50/60">
                        <div className="flex items-center gap-1.5 text-zinc-500 text-xs font-medium">
                          <Route className="w-3.5 h-3.5 text-zinc-700" />
                          <span>Total Routes</span>
                        </div>
                        <div className="text-xl font-bold text-zinc-900 mt-1">
                          {stats?.totalRoutesCount ?? 0}
                        </div>
                      </div>
                      <div className="p-3.5 rounded-lg border border-zinc-200 bg-zinc-50/60">
                        <div className="flex items-center gap-1.5 text-zinc-500 text-xs font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5 text-zinc-700" />
                          <span>Completed Routes</span>
                        </div>
                        <div className="text-xl font-bold text-zinc-900 mt-1">
                          {stats?.completedRoutesCount ?? 0}
                        </div>
                      </div>
                      <div className="p-3.5 rounded-lg border border-zinc-200 bg-zinc-50/60">
                        <div className="flex items-center gap-1.5 text-zinc-500 text-xs font-medium">
                          <Package className="w-3.5 h-3.5 text-zinc-700" />
                          <span>Distributed Orders</span>
                        </div>
                        <div className="text-xl font-bold text-zinc-900 mt-1">
                          {stats?.totalOrdersDistributed ?? 0}
                        </div>
                      </div>
                      <div className="p-3.5 rounded-lg border border-zinc-200 bg-zinc-50/60">
                        <div className="flex items-center gap-1.5 text-zinc-500 text-xs font-medium">
                          <Truck className="w-3.5 h-3.5 text-zinc-700" />
                          <span>Distance Planned</span>
                        </div>
                        <div className="text-xl font-bold text-zinc-900 mt-1">
                          {stats?.totalDistanceKm ?? 0} km
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'details' && (
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              {profileError && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-2.5 text-xs text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{profileError}</span>
                </div>
              )}

              {profileMessage && (
                <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-2.5 text-xs text-emerald-700 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{profileMessage}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-xs font-medium text-zinc-700">
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter full name"
                  required
                  className="w-full bg-white border border-zinc-300 rounded-lg px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-medium text-zinc-700">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+375 29 111 22 33"
                  className="w-full bg-white border border-zinc-300 rounded-lg px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isUpdatingProfile}
                  className="bg-zinc-900 hover:bg-zinc-800 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {isUpdatingProfile ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          )}

          {activeTab === 'security' && (
            <form onSubmit={handleChangePassword} className="space-y-3.5">
              {passwordError && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-2.5 text-xs text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{passwordError}</span>
                </div>
              )}

              {passwordMessage && (
                <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-2.5 text-xs text-emerald-700 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{passwordMessage}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-xs font-medium text-zinc-700">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    required
                    className="w-full bg-white border border-zinc-300 rounded-lg px-3 py-2 pr-9 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 cursor-pointer"
                  >
                    {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-medium text-zinc-700">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    required
                    className="w-full bg-white border border-zinc-300 rounded-lg px-3 py-2 pr-9 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 cursor-pointer"
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
                    placeholder="Re-type new password"
                    required
                    className="w-full bg-white border border-zinc-300 rounded-lg px-3 py-2 pr-9 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isUpdatingPassword}
                  className="bg-zinc-900 hover:bg-zinc-800 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {isUpdatingPassword ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProfileModal;
