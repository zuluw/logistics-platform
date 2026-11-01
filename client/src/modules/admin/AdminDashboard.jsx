import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useSocket } from '../../context/SocketContext.jsx';
import { apiClient } from '../../api/client.js';
import { Button, Card, Modal, ProfileModal } from '../../components/index.js';
import { InteractiveMap } from '../../components/Map/InteractiveMap.jsx';
import { DispatcherDashboard } from '../dispatcher/DispatcherDashboard.jsx';
import {
  Users,
  ShieldCheck,
  Truck,
  LogOut,
  RefreshCw,
  Search,
  Trash2,
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  UserCog,
  X,
  Route as RouteIcon,
  MapPin,
  Clock,
  ArrowRight,
  Navigation,
} from 'lucide-react';

const ROUTE_COLORS = [
  '#2563eb',
  '#7c3aed',
  '#059669',
  '#ea580c',
  '#dc2626',
  '#0891b2',
  '#4f46e5',
  '#d97706',
];

function formatDuration(min) {
  if (!min || min <= 0) return '0 min';
  if (min < 60) return `${min} min`;
  const hours = Math.floor(min / 60);
  const remaining = min % 60;
  return remaining > 0 ? `${hours}h ${remaining}m` : `${hours}h`;
}

export function AdminDashboard() {
  const { user: currentUser, logout } = useAuth();
  const { socket } = useSocket();

  const [viewMode, setViewMode] = useState('admin');
  const [activeTab, setActiveTab] = useState('users');

  const [users, setUsers] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [stats, setStats] = useState({ totalUsers: 0, dispatchersCount: 0, driversCount: 0 });

  const [routes, setRoutes] = useState([]);
  const [isRoutesLoading, setIsRoutesLoading] = useState(false);
  const [focusedRoute, setFocusedRoute] = useState(null);

  const [page, setPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [isStatsLoading, setIsStatsLoading] = useState(false);
  const [updatingUserId, setUpdatingUserId] = useState(null);

  const [deleteCandidate, setDeleteCandidate] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  const [feedback, setFeedback] = useState(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchStats = useCallback(async () => {
    setIsStatsLoading(true);
    try {
      const [allRes, dispRes, driverRes] = await Promise.all([
        apiClient.get('/users?limit=1'),
        apiClient.get('/users?role=DISPATCHER&limit=1'),
        apiClient.get('/users?role=DRIVER&limit=1'),
      ]);
      setStats({
        totalUsers: allRes?.meta?.total ?? 0,
        dispatchersCount: dispRes?.meta?.total ?? 0,
        driversCount: driverRes?.meta?.total ?? 0,
      });
    } catch {
      setStats((prev) => prev);
    } finally {
      setIsStatsLoading(false);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '10');
      if (roleFilter) params.set('role', roleFilter);
      if (debouncedSearch.trim()) params.set('search', debouncedSearch.trim());

      const res = await apiClient.get(`/users?${params.toString()}`);
      setUsers(res?.data || []);
      if (res?.meta) {
        setMeta(res.meta);
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to fetch users' });
    } finally {
      setIsLoading(false);
    }
  }, [page, roleFilter, debouncedSearch]);

  const fetchRoutes = useCallback(async () => {
    setIsRoutesLoading(true);
    try {
      const data = await apiClient.get('/routes');
      setRoutes(data || []);
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to fetch routes' });
    } finally {
      setIsRoutesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    }
  }, [fetchUsers, activeTab]);

  useEffect(() => {
    if (activeTab === 'routes') {
      fetchRoutes();
    }
  }, [fetchRoutes, activeTab]);

  useEffect(() => {
    if (!socket) return;

    const handleRouteCreated = () => {
      fetchRoutes();
      fetchStats();
    };

    const handleStatusChanged = ({ routeId, pointId, status }) => {
      setRoutes((prevRoutes) =>
        prevRoutes.map((r) => {
          if (r.id !== routeId) return r;
          const updatedPoints = (r.routePoints || []).map((pt) =>
            pt.id === pointId
              ? { ...pt, order: { ...pt.order, status } }
              : pt
          );
          return { ...r, routePoints: updatedPoints };
        })
      );
    };

    socket.on('route:created', handleRouteCreated);
    socket.on('order:status_changed', handleStatusChanged);

    return () => {
      socket.off('route:created', handleRouteCreated);
      socket.off('order:status_changed', handleStatusChanged);
    };
  }, [socket, fetchRoutes, fetchStats]);

  const handleRoleChange = async (targetUser, newRole) => {
    if (targetUser.id === currentUser?.id) {
      setFeedback({ type: 'error', message: 'Cannot change your own role' });
      return;
    }

    setUpdatingUserId(targetUser.id);
    try {
      await apiClient.patch(`/users/${targetUser.id}/role`, { role: newRole });
      setFeedback({
        type: 'success',
        message: `Role for ${targetUser.fullName} updated to ${newRole}`,
      });
      fetchUsers();
      fetchStats();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to update user role',
      });
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteCandidate) return;

    setIsDeleting(true);
    setDeleteError(null);
    try {
      await apiClient.delete(`/users/${deleteCandidate.id}`);
      setFeedback({
        type: 'success',
        message: `User ${deleteCandidate.fullName} deleted successfully`,
      });
      setDeleteCandidate(null);
      fetchUsers();
      fetchStats();
    } catch (err) {
      setDeleteError(err.message || 'Failed to delete user');
    } finally {
      setIsDeleting(false);
    }
  };

  const roleBadgeStyles = useMemo(
    () => ({
      ADMIN: 'bg-zinc-900 text-zinc-100 border-zinc-700',
      DISPATCHER: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      DRIVER: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    }),
    []
  );

  const routeStatusBadgeStyles = useMemo(
    () => ({
      ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      COMPLETED: 'bg-zinc-100 text-zinc-700 border-zinc-200',
      DRAFT: 'bg-amber-50 text-amber-700 border-amber-200',
    }),
    []
  );

  const routesWithColors = useMemo(() => {
    return routes.map((route, idx) => ({
      ...route,
      color: ROUTE_COLORS[idx % ROUTE_COLORS.length],
    }));
  }, [routes]);

  const allRouteOrders = useMemo(() => {
    const list = [];
    const seen = new Set();
    routes.forEach((r) => {
      (r.routePoints || []).forEach((pt) => {
        if (pt.order && !seen.has(pt.order.id)) {
          seen.add(pt.order.id);
          list.push(pt.order);
        }
      });
    });
    return list;
  }, [routes]);

  if (viewMode === 'dispatcher') {
    return <DispatcherDashboard onBackToAdmin={() => setViewMode('admin')} />;
  }

  return (
    <div className="h-screen w-screen bg-zinc-50 flex flex-col font-sans text-zinc-900 overflow-hidden">
      <header className="h-16 bg-white border-b border-zinc-200 px-4 sm:px-6 flex items-center justify-between shrink-0 z-30 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-zinc-900 text-white flex items-center justify-center shadow-xs">
            <ShieldAlert className="h-5 w-5 text-zinc-100" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-zinc-900 leading-tight">
                Admin Control Center
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-900 text-zinc-100 uppercase tracking-wider">
                Admin
              </span>
            </div>
            <p className="text-xs text-zinc-500">Fleet operations and access governance</p>
          </div>
        </div>

        <div className="hidden md:flex items-center bg-zinc-100 p-1 rounded-xl border border-zinc-200">
          <button
            type="button"
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'users'
                ? 'bg-white text-zinc-900 shadow-2xs'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span>User Management</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('routes')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'routes'
                ? 'bg-white text-zinc-900 shadow-2xs'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            <RouteIcon className="h-3.5 w-3.5" />
            <span>Global Route Monitor</span>
            {routes.length > 0 && (
              <span className="px-1.5 py-0.2 bg-zinc-200 text-zinc-800 rounded-full text-[10px] font-bold">
                {routes.length}
              </span>
            )}
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setViewMode('dispatcher')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-xs font-semibold text-zinc-800 transition-colors cursor-pointer shadow-2xs"
            title="Switch to Dispatcher Console"
          >
            <span>Dispatcher Console</span>
            <ArrowRight className="h-3.5 w-3.5 text-zinc-400" />
          </button>

          <button
            type="button"
            onClick={() => setIsProfileModalOpen(true)}
            className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-xs font-medium text-zinc-700 transition-colors cursor-pointer shadow-2xs"
            title="My Profile"
          >
            <div className="w-6 h-6 rounded-full bg-zinc-900 text-white flex items-center justify-center font-bold text-[10px]">
              {currentUser?.fullName
                ? currentUser.fullName
                    .split(' ')
                    .filter(Boolean)
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2)
                : 'A'}
            </div>
            <span className="hidden sm:inline font-semibold text-zinc-800">
              {currentUser?.fullName}
            </span>
          </button>

          <Button variant="ghost" size="sm" onClick={logout} title="Sign Out">
            <LogOut className="h-4 w-4 text-zinc-500" />
          </Button>
        </div>
      </header>

      <div className="md:hidden bg-zinc-100 border-b border-zinc-200 p-2 flex gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('users')}
          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold text-center transition-all ${
            activeTab === 'users'
              ? 'bg-white text-zinc-900 shadow-2xs'
              : 'text-zinc-600'
          }`}
        >
          User Management
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('routes')}
          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold text-center transition-all ${
            activeTab === 'routes'
              ? 'bg-white text-zinc-900 shadow-2xs'
              : 'text-zinc-600'
          }`}
        >
          Route Monitor ({routes.length})
        </button>
      </div>

      {activeTab === 'users' ? (
        <main className="flex-1 overflow-y-auto max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          {feedback && (
            <div
              className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl border text-sm transition-all ${
                feedback.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border-rose-200'
              }`}
            >
              <div className="flex items-center gap-2.5">
                {feedback.type === 'success' ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                )}
                <span className="font-medium">{feedback.message}</span>
              </div>
              <button
                type="button"
                onClick={() => setFeedback(null)}
                className="p-1 rounded-md hover:bg-black/5 transition-colors cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <Card className="p-5 border-zinc-200/80 bg-white shadow-2xs">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                    Total Users
                  </p>
                  <h3 className="text-2xl font-bold text-zinc-900 mt-1">
                    {isStatsLoading ? '...' : stats.totalUsers}
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1">Platform registered members</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-zinc-100 text-zinc-800 flex items-center justify-center">
                  <Users className="h-6 w-6" />
                </div>
              </div>
            </Card>

            <Card className="p-5 border-zinc-200/80 bg-white shadow-2xs">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                    Active Dispatchers
                  </p>
                  <h3 className="text-2xl font-bold text-zinc-900 mt-1">
                    {isStatsLoading ? '...' : stats.dispatchersCount}
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1">Route planners and operators</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
                  <ShieldCheck className="h-6 w-6" />
                </div>
              </div>
            </Card>

            <Card className="p-5 border-zinc-200/80 bg-white shadow-2xs">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                    Active Drivers
                  </p>
                  <h3 className="text-2xl font-bold text-zinc-900 mt-1">
                    {isStatsLoading ? '...' : stats.driversCount}
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1">Assigned field logistics fleet</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <Truck className="h-6 w-6" />
                </div>
              </div>
            </Card>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white shadow-2xs overflow-hidden">
            <div className="p-5 border-b border-zinc-200 flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between bg-white">
              <div className="flex flex-1 items-center gap-3 max-w-md">
                <div className="relative w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name or email..."
                    className="w-full pl-9 pr-8 py-2 rounded-lg border border-zinc-300 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-colors"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-zinc-600 cursor-pointer"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <select
                  value={roleFilter}
                  onChange={(e) => {
                    setRoleFilter(e.target.value);
                    setPage(1);
                  }}
                  className="py-2 px-3 rounded-lg border border-zinc-300 bg-white text-xs font-medium text-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 cursor-pointer"
                >
                  <option value="">All Roles</option>
                  <option value="DISPATCHER">Dispatcher</option>
                  <option value="DRIVER">Driver</option>
                  <option value="ADMIN">Admin</option>
                </select>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    fetchUsers();
                    fetchStats();
                  }}
                  isLoading={isLoading}
                  title="Refresh Table"
                  className="border-zinc-300"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50/80 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                    <th className="py-3 px-5">Employee</th>
                    <th className="py-3 px-5">Contact</th>
                    <th className="py-3 px-5">Current Role</th>
                    <th className="py-3 px-5">Registered</th>
                    <th className="py-3 px-5">Assign Role</th>
                    <th className="py-3 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 text-sm">
                  {isLoading && users.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-zinc-400">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <RefreshCw className="h-5 w-5 animate-spin text-zinc-400" />
                          <span className="text-xs font-medium">Loading employee records...</span>
                        </div>
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-zinc-500">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <UserCog className="h-8 w-8 text-zinc-300" />
                          <span className="text-sm font-semibold text-zinc-700">No users found</span>
                          <p className="text-xs text-zinc-400">Try adjusting your filter or search query</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    users.map((employee) => {
                      const isSelf = employee.id === currentUser?.id;
                      const isUpdating = updatingUserId === employee.id;

                      return (
                        <tr
                          key={employee.id}
                          className="hover:bg-zinc-50/70 transition-colors group"
                        >
                          <td className="py-3.5 px-5">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-zinc-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
                                {employee.fullName
                                  ? employee.fullName
                                      .split(' ')
                                      .filter(Boolean)
                                      .map((n) => n[0])
                                      .join('')
                                      .toUpperCase()
                                      .slice(0, 2)
                                  : 'U'}
                              </div>
                              <div>
                                <div className="font-semibold text-zinc-900 flex items-center gap-1.5">
                                  <span>{employee.fullName}</span>
                                  {isSelf && (
                                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-zinc-100 text-zinc-600 border border-zinc-200">
                                      You
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-zinc-500">{employee.email}</p>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-5 text-zinc-600 text-xs">
                            {employee.phone || <span className="text-zinc-400">N/A</span>}
                          </td>

                          <td className="py-3.5 px-5">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${
                                roleBadgeStyles[employee.role] ||
                                'bg-zinc-100 text-zinc-700 border-zinc-200'
                              }`}
                            >
                              {employee.role}
                            </span>
                          </td>

                          <td className="py-3.5 px-5 text-zinc-500 text-xs whitespace-nowrap">
                            {new Date(employee.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </td>

                          <td className="py-3.5 px-5">
                            <select
                              value={employee.role}
                              disabled={isSelf || isUpdating}
                              onChange={(e) => handleRoleChange(employee, e.target.value)}
                              title={isSelf ? 'Cannot change your own role' : 'Change employee role'}
                              className="py-1 px-2.5 rounded-md border border-zinc-300 bg-white text-xs font-medium text-zinc-700 disabled:opacity-50 disabled:bg-zinc-100 disabled:cursor-not-allowed focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 cursor-pointer shadow-2xs"
                            >
                              <option value="DISPATCHER">Dispatcher</option>
                              <option value="DRIVER">Driver</option>
                              <option value="ADMIN">Admin</option>
                            </select>
                          </td>

                          <td className="py-3.5 px-5 text-right">
                            <button
                              type="button"
                              disabled={isSelf}
                              onClick={() => {
                                setDeleteError(null);
                                setDeleteCandidate(employee);
                              }}
                              title={isSelf ? 'Cannot delete your own account' : 'Delete user'}
                              className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 disabled:opacity-30 disabled:hover:text-zinc-400 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors cursor-pointer"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-4 border-t border-zinc-200 bg-zinc-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-500">
              <div>
                Showing <span className="font-semibold text-zinc-800">{users.length}</span> of{' '}
                <span className="font-semibold text-zinc-800">{meta.total}</span> employees
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1 || isLoading}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="gap-1 px-3 py-1 text-xs border-zinc-300"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  <span>Previous</span>
                </Button>

                <span className="px-2 font-medium text-zinc-700">
                  Page {meta.page} of {meta.totalPages}
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= meta.totalPages || isLoading}
                  onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                  className="gap-1 px-3 py-1 text-xs border-zinc-300"
                >
                  <span>Next</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </main>
      ) : (
        <div className="flex-1 flex overflow-hidden h-[calc(100vh-65px)]">
          <aside className="w-80 lg:w-96 flex flex-col border-r border-zinc-200 bg-white h-[calc(100vh-65px)] overflow-y-auto p-4 shrink-0 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div>
                <h2 className="text-base font-bold text-zinc-900 leading-tight">
                  Active Routes Overview
                </h2>
                <p className="text-xs text-zinc-500">Live fleet tracking and telemetry</p>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={fetchRoutes}
                isLoading={isRoutesLoading}
                title="Refresh routes list"
                className="border-zinc-300 h-8 px-2.5"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            </div>

            {focusedRoute && (
              <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-zinc-100 text-xs text-zinc-700">
                <span className="font-semibold">Focused on route</span>
                <button
                  type="button"
                  onClick={() => setFocusedRoute(null)}
                  className="text-indigo-600 hover:text-indigo-800 font-bold cursor-pointer"
                >
                  Show All Routes
                </button>
              </div>
            )}

            <div className="space-y-3">
              {isRoutesLoading && routes.length === 0 ? (
                <div className="py-16 text-center text-zinc-400 flex flex-col items-center gap-2">
                  <RefreshCw className="h-6 w-6 animate-spin text-zinc-400" />
                  <span className="text-xs font-medium">Loading logistics routes...</span>
                </div>
              ) : routes.length === 0 ? (
                <div className="py-16 text-center text-zinc-500 flex flex-col items-center gap-2">
                  <RouteIcon className="h-10 w-10 text-zinc-300" />
                  <span className="text-sm font-semibold text-zinc-800">No routes registered</span>
                  <p className="text-xs text-zinc-400 max-w-xs leading-relaxed">
                    Switch to Dispatcher Console to build and dispatch delivery routes.
                  </p>
                </div>
              ) : (
                routesWithColors.map((route) => {
                  const isFocused = focusedRoute?.id === route.id;
                  const totalPoints = (route.routePoints || []).length;
                  const deliveredPoints = (route.routePoints || []).filter(
                    (p) => p.order?.status === 'DELIVERED'
                  ).length;
                  const progress = totalPoints > 0 ? Math.round((deliveredPoints / totalPoints) * 100) : 0;

                  return (
                    <div
                      key={route.id}
                      className={`rounded-xl border p-4 transition-all shadow-2xs space-y-3 bg-white ${
                        isFocused
                          ? 'border-zinc-900 ring-2 ring-zinc-900/10 bg-zinc-50/50'
                          : 'border-zinc-200 hover:border-zinc-300'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="w-3 h-3 rounded-full shrink-0 shadow-xs"
                            style={{ backgroundColor: route.color }}
                            title="Route Color"
                          />
                          <h3 className="text-sm font-bold text-zinc-900 truncate">
                            {route.vehicle ? `${route.vehicle.brand} (${route.vehicle.licensePlate})` : 'Assigned Fleet'}
                          </h3>
                        </div>

                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border shrink-0 ${
                            routeStatusBadgeStyles[route.status] ||
                            'bg-zinc-100 text-zinc-700 border-zinc-200'
                          }`}
                        >
                          {route.status}
                        </span>
                      </div>

                      <div className="space-y-1.5 text-xs text-zinc-600">
                        <div className="flex items-center gap-1.5">
                          <Truck className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                          <span className="text-zinc-500">Driver:</span>
                          <span className="font-semibold text-zinc-800">
                            {route.driver?.fullName || 'Unassigned'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-zinc-500 pt-1">
                          <div className="flex items-center gap-1">
                            <Navigation className="h-3 w-3 text-zinc-400" />
                            <span>{route.totalDistanceKm.toFixed(1)} km</span>
                          </div>

                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-zinc-400" />
                            <span>ETA {formatDuration(route.totalDurationMin)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1.5 pt-1">
                        <div className="flex items-center justify-between text-[11px] font-medium text-zinc-500">
                          <span>Delivery Progress</span>
                          <span className="font-semibold text-zinc-800">
                            {deliveredPoints} / {totalPoints} ({progress}%)
                          </span>
                        </div>
                        <div className="w-full bg-zinc-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-emerald-600 h-1.5 rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>

                      <div className="pt-2 flex items-center justify-between border-t border-zinc-100">
                        <span className="text-[10px] text-zinc-400">
                          {new Date(route.routeDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>

                        <button
                          type="button"
                          onClick={() => setFocusedRoute(route)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                            isFocused
                              ? 'bg-zinc-900 text-white'
                              : 'border border-zinc-300 bg-white hover:bg-zinc-100 text-zinc-700'
                          }`}
                        >
                          <MapPin className="h-3 w-3" />
                          <span>{isFocused ? 'Focused' : 'Focus on Map'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </aside>

          <main className="flex-1 h-[calc(100vh-65px)] relative overflow-hidden bg-zinc-100">
            <InteractiveMap
              orders={allRouteOrders}
              routes={routesWithColors}
              focusRoute={focusedRoute}
              className="w-full h-full"
            />

            <div className="absolute bottom-5 right-5 z-20 bg-white/95 backdrop-blur-xs p-3.5 rounded-xl border border-zinc-200 shadow-md text-xs space-y-2 pointer-events-auto">
              <div className="font-bold text-zinc-900 flex items-center justify-between gap-4">
                <span>Map Legend</span>
                <span className="text-[10px] font-normal text-zinc-500">Live telemetry</span>
              </div>
              <div className="space-y-1.5 text-zinc-600 text-[11px]">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-zinc-900 border border-white shrink-0" />
                  <span>Central Depot / Warehouse</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-blue-600 border border-white shrink-0" />
                  <span>Delivery Order Stop</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 border border-white shrink-0" />
                  <span>Delivered Point</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-1 bg-blue-600 rounded-sm shrink-0" />
                  <span>Active Routes Geometry</span>
                </div>
              </div>
            </div>
          </main>
        </div>
      )}

      <Modal
        isOpen={Boolean(deleteCandidate)}
        onClose={() => {
          if (!isDeleting) {
            setDeleteCandidate(null);
            setDeleteError(null);
          }
        }}
        title="Delete User Account"
        maxWidth="max-w-md"
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              disabled={isDeleting}
              onClick={() => {
                setDeleteCandidate(null);
                setDeleteError(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              isLoading={isDeleting}
              onClick={handleConfirmDelete}
            >
              Delete User
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-zinc-600 leading-relaxed">
            Are you sure you want to permanently delete the account for{' '}
            <strong className="text-zinc-900 font-semibold">{deleteCandidate?.fullName}</strong> (
            {deleteCandidate?.email})?
          </p>
          <p className="text-xs text-rose-600 font-medium">
            This action cannot be undone. Active drivers with assigned vehicles or ongoing delivery routes cannot be deleted.
          </p>

          {deleteError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{deleteError}</span>
            </div>
          )}
        </div>
      </Modal>

      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </div>
  );
}

export default AdminDashboard;
