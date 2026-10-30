import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { apiClient } from '../api/client.js';
import { useAuth } from './AuthContext.jsx';
import { useSocket } from './SocketContext.jsx';

const LogisticsContext = createContext(null);

export function LogisticsProvider({ children }) {
  const { isAuthenticated, isDispatcher, isDriver } = useAuth();
  const { socket } = useSocket();

  const [orders, setOrders] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [activeRoute, setActiveRoute] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchOrders = useCallback(async () => {
    try {
      const response = await apiClient.get('/orders');
      setOrders(response?.data || response || []);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const fetchVehicles = useCallback(async () => {
    try {
      const data = await apiClient.get('/vehicles');
      setVehicles(data || []);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const fetchRoutes = useCallback(async () => {
    try {
      const data = await apiClient.get('/routes');
      setRoutes(data || []);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const fetchMyActiveRoute = useCallback(async () => {
    try {
      const data = await apiClient.get('/routes/my');
      setActiveRoute(data);
    } catch {
      setActiveRoute(null);
    }
  }, []);

  const refreshAll = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    setError(null);
    try {
      if (isDispatcher) {
        await Promise.all([fetchOrders(), fetchVehicles(), fetchRoutes()]);
      } else if (isDriver) {
        await fetchMyActiveRoute();
      }
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, isDispatcher, isDriver, fetchOrders, fetchVehicles, fetchRoutes, fetchMyActiveRoute]);

  useEffect(() => {
    if (isAuthenticated) {
      refreshAll();
    } else {
      setOrders([]);
      setVehicles([]);
      setRoutes([]);
      setActiveRoute(null);
    }
  }, [isAuthenticated, refreshAll]);

  useEffect(() => {
    if (!socket) return;

    const handleRouteCreated = (newRoute) => {
      setRoutes((prev) => [newRoute, ...prev.filter((r) => r.id !== newRoute.id)]);
      fetchOrders();
      fetchVehicles();
    };

    const handleRouteAssigned = (assignedRoute) => {
      setActiveRoute(assignedRoute);
    };

    const handleOrderStatusChanged = ({ routeId, pointId, status }) => {
      setRoutes((prev) =>
        prev.map((r) => {
          if (r.id !== routeId) return r;
          return {
            ...r,
            routePoints: r.routePoints.map((p) =>
              p.id === pointId
                ? {
                    ...p,
                    order: { ...p.order, status },
                  }
                : p
            ),
          };
        })
      );

      setActiveRoute((prev) => {
        if (!prev || prev.id !== routeId) return prev;
        return {
          ...prev,
          routePoints: prev.routePoints.map((p) =>
            p.id === pointId
              ? {
                  ...p,
                  order: { ...p.order, status },
                }
              : p
          ),
        };
      });

      fetchOrders();
    };

    socket.on('route:created', handleRouteCreated);
    socket.on('route:assigned', handleRouteAssigned);
    socket.on('order:status_changed', handleOrderStatusChanged);

    return () => {
      socket.off('route:created', handleRouteCreated);
      socket.off('route:assigned', handleRouteAssigned);
      socket.off('order:status_changed', handleOrderStatusChanged);
    };
  }, [socket, fetchOrders, fetchVehicles]);

  const createOrder = useCallback(
    async (orderData) => {
      const newOrder = await apiClient.post('/orders', orderData);
      setOrders((prev) => [newOrder, ...prev]);
      return newOrder;
    },
    []
  );

  const calculateRoute = useCallback(async (payload) => {
    return apiClient.post('/routes/calculate', payload);
  }, []);

  const createRoute = useCallback(async (payload) => {
    const route = await apiClient.post('/routes', payload);
    return route;
  }, []);

  const updatePointStatus = useCallback(async (routeId, pointId, status) => {
    const updated = await apiClient.patch(`/routes/${routeId}/points/${pointId}`, { status });
    setActiveRoute(updated);
    return updated;
  }, []);

  const value = useMemo(
    () => ({
      orders,
      vehicles,
      routes,
      activeRoute,
      isLoading,
      error,
      refreshAll,
      fetchOrders,
      fetchVehicles,
      fetchRoutes,
      fetchMyActiveRoute,
      createOrder,
      calculateRoute,
      createRoute,
      updatePointStatus,
    }),
    [
      orders,
      vehicles,
      routes,
      activeRoute,
      isLoading,
      error,
      refreshAll,
      fetchOrders,
      fetchVehicles,
      fetchRoutes,
      fetchMyActiveRoute,
      createOrder,
      calculateRoute,
      createRoute,
      updatePointStatus,
    ]
  );

  return <LogisticsContext.Provider value={value}>{children}</LogisticsContext.Provider>;
}

export function useLogistics() {
  const context = useContext(LogisticsContext);
  if (!context) {
    throw new Error('useLogistics must be used within a LogisticsProvider');
  }
  return context;
}

export default LogisticsContext;
