import { useState, useMemo } from 'react';
import { Button, Input } from '../../components/index.js';
import { Plus, Search, Filter, Package, CheckSquare, Square, Download } from 'lucide-react';
import { exportOrdersToCsv } from '../../utils/exportCsv.js';

function getStatusBadge(status) {
  const styles = {
    PENDING: 'bg-blue-50 text-blue-700 border-blue-200',
    ASSIGNED: 'bg-purple-50 text-purple-700 border-purple-200',
    IN_TRANSIT: 'bg-amber-50 text-amber-700 border-amber-200',
    DELIVERED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    CANCELLED: 'bg-slate-100 text-slate-600 border-slate-200',
  };

  return (
    <span
      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
        styles[status] || styles.PENDING
      }`}
    >
      {status}
    </span>
  );
}

export function OrdersListPanel({
  orders = [],
  selectedOrderIds = [],
  onToggleOrder,
  onSelectAll,
  onClearSelection,
  onOpenCreateModal,
}) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesStatus = statusFilter === 'ALL' || order.status === statusFilter;
      const term = search.toLowerCase().trim();
      const matchesSearch =
        !term ||
        order.customerName?.toLowerCase().includes(term) ||
        order.deliveryAddress?.toLowerCase().includes(term) ||
        order.customerPhone?.toLowerCase().includes(term);

      return matchesStatus && matchesSearch;
    });
  }, [orders, statusFilter, search]);

  const pendingOrders = useMemo(() => {
    return filteredOrders.filter((o) => o.status === 'PENDING');
  }, [filteredOrders]);

  const allPendingSelected =
    pendingOrders.length > 0 &&
    pendingOrders.every((o) => selectedOrderIds.includes(o.id));

  return (
    <div className="flex flex-col h-full bg-white border-r border-slate-200">
      <div className="p-4 border-b border-slate-200 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">Orders Pool</h2>
            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
              {orders.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => exportOrdersToCsv(filteredOrders)}
              className="gap-1.5 text-xs text-slate-700 hover:text-slate-900 bg-white shadow-2xs"
              title="Export filtered orders to CSV"
            >
              <Download className="h-3.5 w-3.5 text-slate-500" />
              <span>Export CSV</span>
            </Button>

            <Button
              size="sm"
              variant="primary"
              onClick={onOpenCreateModal}
              className="gap-1.5"
            >
              <Plus className="h-4 w-4" />
              <span>Add Order</span>
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search by customer or address..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 py-1.5 text-xs"
            />
          </div>

          <div className="relative shrink-0">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-700 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="IN_TRANSIT">In Transit</option>
              <option value="DELIVERED">Delivered</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={allPendingSelected ? onClearSelection : () => onSelectAll(pendingOrders.map((o) => o.id))}
              disabled={pendingOrders.length === 0}
              className="inline-flex items-center gap-1.5 font-medium text-slate-700 hover:text-indigo-600 disabled:opacity-40 cursor-pointer"
            >
              {allPendingSelected ? (
                <CheckSquare className="h-4 w-4 text-indigo-600" />
              ) : (
                <Square className="h-4 w-4 text-slate-400" />
              )}
              <span>Select Pending ({selectedOrderIds.length})</span>
            </button>
          </div>

          {selectedOrderIds.length > 0 && (
            <button
              type="button"
              onClick={onClearSelection}
              className="text-xs text-slate-400 hover:text-slate-600 underline cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 space-y-1.5">
        {filteredOrders.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-xs font-medium text-slate-600">No orders found</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Try adjusting search or status filters</p>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const isSelected = selectedOrderIds.includes(order.id);
            const isSelectable = order.status === 'PENDING';

            return (
              <div
                key={order.id}
                onClick={() => isSelectable && onToggleOrder(order.id)}
                className={`p-3 rounded-lg border transition-all ${
                  isSelected
                    ? 'border-indigo-300 bg-indigo-50/50 shadow-xs'
                    : 'border-slate-200/80 bg-white hover:border-slate-300'
                } ${isSelectable ? 'cursor-pointer' : 'opacity-85'}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      disabled={!isSelectable}
                      onChange={() => onToggleOrder(order.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 mt-1 cursor-pointer disabled:cursor-not-allowed"
                    />
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900 leading-snug">
                        {order.customerName}
                      </h4>
                      <p className="text-xs text-slate-600 mt-0.5 leading-snug">
                        {order.deliveryAddress}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0">{getStatusBadge(order.status)}</div>
                </div>

                <div className="mt-2.5 pt-2 border-t border-slate-100/80 flex items-center justify-between text-[11px] text-slate-500">
                  <div className="flex items-center gap-3">
                    <span>
                      Weight: <strong className="text-slate-700">{order.weightKg} kg</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Vol: <strong className="text-slate-700">{order.volumeM3} m³</strong>
                    </span>
                  </div>
                  <div className="text-slate-400 font-mono text-[10px]">
                    {order.customerPhone}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default OrdersListPanel;
