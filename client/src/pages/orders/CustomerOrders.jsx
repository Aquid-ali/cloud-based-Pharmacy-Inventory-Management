import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  FiShoppingBag,
  FiClock,
  FiTruck,
  FiCheckCircle,
  FiX,
  FiChevronRight,
  FiPackage,
} from 'react-icons/fi';
import PageHeader from '../../components/PageHeader';
import StatCard from '../../components/StatCard';
import DataTable from '../../components/DataTable';
import Spinner from '../../components/Spinner';
import Modal from '../../components/Modal';
import { getStoreOrders, confirmOrderSale, updateOrderStatus } from '../../services/orderService';
import { statusTint, ORDER_STEPS } from '../../utils/orderStatus';

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Map from current status to next forward status (null = terminal) */
const NEXT_STATUS = {
  Placed: 'Processing',
  Processing: 'Out for Delivery',
  'Out for Delivery': 'Delivered',
  Delivered: null,
  Cancelled: null,
};

/** Human-readable label for the action button */
const ACTION_LABEL = {
  Placed: 'Start Processing',
  Processing: 'Mark Out for Delivery',
  'Out for Delivery': 'Mark Delivered',
};

/** Icon component for the action button */
const ACTION_ICON = {
  Placed: FiPackage,
  Processing: FiTruck,
  'Out for Delivery': FiCheckCircle,
};

/** Returns the timestamp from statusHistory for a given status, if present */
function getStatusTimestamp(order, status) {
  if (!order || !Array.isArray(order.statusHistory) || order.statusHistory.length === 0) return null;
  const entry = [...order.statusHistory].reverse().find((h) => h.status === status);
  return entry ? new Date(entry.changedAt) : null;
}

// ─── Mini status timeline shown inside the order modal ──────────────────────

const ModalTimeline = ({ order }) => {
  const currentIndex = ORDER_STEPS.indexOf(order.status);
  if (order.status === 'Cancelled') {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700 text-sm">
        <FiX size={16} className="shrink-0" />
        <span className="font-medium">Order Cancelled</span>
      </div>
    );
  }
  return (
    <ol className="flex items-start">
      {ORDER_STEPS.map((step, i) => {
        const done = i <= currentIndex;
        const isLast = i === ORDER_STEPS.length - 1;
        const ts = getStatusTimestamp(order, step);
        return (
          <li key={step} className={'flex items-center ' + (isLast ? '' : 'flex-1')}>
            <div className="flex flex-col items-center">
              <span
                className={
                  'flex items-center justify-center w-7 h-7 rounded-full border-2 shrink-0 transition-colors ' +
                  (done
                    ? 'bg-brandPrimary border-brandPrimary text-white'
                    : 'bg-white border-slate-200 text-slate-300')
                }
              >
                {done ? (
                  <FiCheckCircle size={13} />
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                )}
              </span>
              <span
                className={
                  'mt-1.5 text-[10px] font-semibold text-center w-20 ' +
                  (done ? 'text-slate-700' : 'text-slate-400')
                }
              >
                {step}
              </span>
              {ts && (
                <span className="mt-0.5 text-[9px] text-slate-400 text-center w-20 leading-tight">
                  {ts.toLocaleDateString()}{' '}
                  {ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>
            {!isLast && (
              <div
                className={
                  'flex-1 h-0.5 mb-8 ' +
                  (i < currentIndex ? 'bg-brandPrimary' : 'bg-slate-200')
                }
              />
            )}
          </li>
        );
      })}
    </ol>
  );
};

// ─── Confirmation dialog for status updates ──────────────────────────────────

const StatusConfirmDialog = ({ order, nextStatus, loading, onConfirm, onCancel }) => {
  const ActionIcon = ACTION_ICON[order.status] || FiChevronRight;
  return (
    <Modal onClose={onCancel} maxWidth="md" className="p-6 space-y-5">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-brandPrimary/10 text-brandPrimary flex items-center justify-center shrink-0">
          <ActionIcon size={22} />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900 font-display">Confirm status update</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Order #{order._id.slice(-8).toUpperCase()}
          </p>
        </div>
      </div>
      <p className="text-sm text-slate-600">
        Change order status from{' '}
        <span className={'inline-flex px-2 py-0.5 rounded-md border text-xs font-semibold ' + (statusTint[order.status] || '')}>
          {order.status}
        </span>{' '}
        to{' '}
        <span className={'inline-flex px-2 py-0.5 rounded-md border text-xs font-semibold ' + (statusTint[nextStatus] || '')}>
          {nextStatus}
        </span>
        ?
      </p>
      <p className="text-xs text-slate-400">
        This action cannot be undone and will be visible to the customer immediately.
      </p>
      <div className="flex items-center justify-end gap-3 pt-1">
        <button
          onClick={onCancel}
          disabled={loading}
          className="px-5 py-2.5 rounded-2xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className="px-5 py-2.5 rounded-2xl bg-brandPrimary hover:bg-brandPrimary/90 text-white text-sm font-medium transition-colors shadow-lg shadow-brandPrimary/20 disabled:opacity-60 flex items-center gap-2"
        >
          {loading && <Spinner size="sm" />}
          {ACTION_LABEL[order.status] || 'Update Status'}
        </button>
      </div>
    </Modal>
  );
};

// ─── Main page ───────────────────────────────────────────────────────────────

const CustomerOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [isCodCollected, setIsCodCollected] = useState(false);

  // Status-update confirmation dialog
  const [confirmDialog, setConfirmDialog] = useState(null); // { order, nextStatus }
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data } = await getStoreOrders();
      setOrders(data.data.orders);
    } catch (error) {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleRowClick = (order) => {
    setSelectedOrder(order);
    setIsCodCollected(false);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedOrder(null);
  };

  // Helper: sync updated order into both the list and the open modal
  const applyOrderUpdate = (updatedOrder) => {
    setOrders((prev) => prev.map((o) => (o._id === updatedOrder._id ? updatedOrder : o)));
    if (selectedOrder && selectedOrder._id === updatedOrder._id) {
      setSelectedOrder(updatedOrder);
    }
  };

  // Existing payment-confirmation + sale creation flow (untouched business logic)
  const handleConfirmSale = async () => {
    if (!selectedOrder) return;
    setConfirmLoading(true);
    try {
      const res = await confirmOrderSale(selectedOrder._id);
      toast.success('Payment confirmed and sale completed successfully.');
      applyOrderUpdate(res.data.data.order);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to complete sale');
    } finally {
      setConfirmLoading(false);
    }
  };

  // Open confirmation dialog for a fulfilment status change
  const handleStatusActionClick = (order, e) => {
    if (e) e.stopPropagation(); // prevent row-click from also opening the modal
    const nextStatus = NEXT_STATUS[order.status];
    if (!nextStatus) return;
    setConfirmDialog({ order, nextStatus });
  };

  // Execute the confirmed status update
  const handleStatusUpdateConfirm = async () => {
    if (!confirmDialog) return;
    const { order, nextStatus } = confirmDialog;
    setStatusUpdateLoading(true);
    try {
      const res = await updateOrderStatus(order._id, nextStatus);
      const updatedOrder = res.data.data.order;
      toast.success('Order marked as "' + nextStatus + '"');
      applyOrderUpdate(updatedOrder);
      setConfirmDialog(null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update order status');
    } finally {
      setStatusUpdateLoading(false);
    }
  };

  // ── Table column definitions ──────────────────────────────────────────────

  const columns = [
    {
      key: 'id',
      label: 'Order',
      render: (row) => (
        <span className="font-mono text-xs">#{row._id.slice(-8).toUpperCase()}</span>
      ),
    },
    {
      key: 'customer',
      label: 'Customer',
      render: (row) => (
        <div>
          <p className="font-medium text-slate-800">{row.user?.fullName}</p>
          <p className="text-xs text-slate-400">{row.user?.email}</p>
        </div>
      ),
    },
    {
      key: 'items',
      label: 'Items',
      render: (row) => row.items.length + ' item' + (row.items.length > 1 ? 's' : ''),
    },
    { key: 'deliveryType', label: 'Fulfillment' },
    {
      key: 'payment',
      label: 'Payment',
      render: (row) => (
        <div>
          <p>{row.paymentMethod}</p>
          <p className="text-xs text-slate-400">{row.paymentStatus}</p>
        </div>
      ),
    },
    {
      key: 'total',
      label: 'Total',
      render: (row) => '\u20B9' + row.pricing.totalAmount.toFixed(2),
    },
    {
      key: 'createdAt',
      label: 'Placed',
      render: (row) => new Date(row.createdAt).toLocaleDateString(),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        const latestTs = getStatusTimestamp(row, row.status);
        return (
          <div className="flex flex-col gap-0.5">
            <span
              className={
                'text-xs font-semibold border rounded-lg px-2 py-1 bg-white w-fit ' +
                (statusTint[row.status] || 'text-slate-700 border-slate-200')
              }
            >
              {row.status}
            </span>
            {latestTs && (
              <span className="text-[10px] text-slate-400">
                {latestTs.toLocaleDateString()}{' '}
                {latestTs.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'action',
      label: 'Action',
      render: (row) => {
        const next = NEXT_STATUS[row.status];
        if (row.status === 'Delivered') {
          return (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-2 py-1">
              <FiCheckCircle size={12} /> Completed
            </span>
          );
        }
        if (!next) return null; // Cancelled — no action
        const ActionIcon = ACTION_ICON[row.status] || FiChevronRight;
        return (
          <button
            onClick={(e) => handleStatusActionClick(row, e)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-brandPrimary hover:bg-brandPrimary/90 rounded-lg px-3 py-1.5 transition-colors shadow-sm whitespace-nowrap"
          >
            <ActionIcon size={12} />
            {ACTION_LABEL[row.status]}
          </button>
        );
      },
    },
  ];

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customer Orders"
        description="Orders placed by customers shopping from your store."
      />

      {/* Dashboard stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          icon={FiShoppingBag}
          label="Total Orders"
          value={orders.length}
          bgTint="bg-brandPrimary/10"
          iconColor="text-brandPrimary"
          borderColor="border-brandPrimary/20"
        />
        <StatCard
          icon={FiClock}
          label="Placed"
          value={orders.filter((o) => o.status === 'Placed').length}
          bgTint="bg-blue-500/10"
          iconColor="text-blue-600"
          borderColor="border-blue-500/20"
        />
        <StatCard
          icon={FiTruck}
          label="In Progress"
          value={orders.filter((o) => o.status === 'Processing' || o.status === 'Out for Delivery').length}
          bgTint="bg-amber-500/10"
          iconColor="text-amber-600"
          borderColor="border-amber-500/20"
        />
        <StatCard
          icon={FiCheckCircle}
          label="Delivered"
          value={orders.filter((o) => o.status === 'Delivered').length}
          bgTint="bg-emerald-500/10"
          iconColor="text-emerald-600"
          borderColor="border-emerald-500/20"
        />
      </div>

      {/* Orders table */}
      {loading ? (
        <Spinner size="lg" />
      ) : (
        <DataTable
          columns={columns}
          data={orders}
          emptyTitle="No orders yet"
          emptyMessage="Orders placed by customers shopping from your store will show up here."
          onRowClick={handleRowClick}
        />
      )}

      {/* ── Order detail modal ─────────────────────────────────────────────── */}
      {isModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-semibold text-slate-800">
                  Order #{selectedOrder._id.slice(-8).toUpperCase()}
                </h3>
                <span
                  className={
                    'text-xs font-semibold border rounded-lg px-2 py-1 ' +
                    (statusTint[selectedOrder.status] || 'text-slate-700 border-slate-200')
                  }
                >
                  {selectedOrder.status}
                </span>
              </div>
              <button
                onClick={closeModal}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-50"
              >
                <FiX size={20} />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {/* Fulfilment timeline */}
              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-4">Fulfilment Progress</h4>
                <ModalTimeline order={selectedOrder} />
              </div>

              {/* Customer details */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <h4 className="text-sm font-semibold text-slate-700 mb-2">Customer Details</h4>
                <p className="text-sm text-slate-600 font-medium">{selectedOrder.user?.fullName}</p>
                <p className="text-sm text-slate-500">{selectedOrder.user?.email}</p>
                {selectedOrder.address && (
                  <p className="text-sm text-slate-500 mt-2">
                    {selectedOrder.address.line1}, {selectedOrder.address.city},{' '}
                    {selectedOrder.address.state} {selectedOrder.address.pincode}
                  </p>
                )}
              </div>

              {/* Order items */}
              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-3">Order Items</h4>
                <div className="border border-slate-100 rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="text-left px-4 py-2 font-medium text-slate-500">Medicine</th>
                        <th className="text-right px-4 py-2 font-medium text-slate-500">Qty</th>
                        <th className="text-right px-4 py-2 font-medium text-slate-500">Price</th>
                        <th className="text-right px-4 py-2 font-medium text-slate-500">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedOrder.items.map((item, idx) => (
                        <tr key={idx}>
                          <td className="px-4 py-3 text-slate-700">{item.medicineName}</td>
                          <td className="px-4 py-3 text-slate-700 text-right">{item.quantity}</td>
                          <td className="px-4 py-3 text-slate-700 text-right">
                            {'\u20B9'}{item.sellingPrice.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-slate-700 text-right font-medium">
                            {'\u20B9'}{item.lineTotal.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pricing */}
              <div className="flex justify-end">
                <div className="w-64 space-y-2 text-sm">
                  <div className="flex justify-between text-slate-500">
                    <span>Subtotal</span>
                    <span>{'\u20B9'}{selectedOrder.pricing.subtotal.toFixed(2)}</span>
                  </div>
                  {selectedOrder.pricing.deliveryFee > 0 && (
                    <div className="flex justify-between text-slate-500">
                      <span>Delivery Fee</span>
                      <span>{'\u20B9'}{selectedOrder.pricing.deliveryFee.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-semibold text-slate-800 pt-2 border-t border-slate-100">
                    <span>Total</span>
                    <span>{'\u20B9'}{selectedOrder.pricing.totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Payment status */}
              <div
                className={
                  'p-4 rounded-xl border ' +
                  (selectedOrder.saleId
                    ? 'bg-emerald-50 border-emerald-100'
                    : 'bg-amber-50 border-amber-100')
                }
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p
                      className={
                        'text-sm font-semibold ' +
                        (selectedOrder.saleId ? 'text-emerald-800' : 'text-amber-800')
                      }
                    >
                      Payment: {selectedOrder.paymentStatus}
                    </p>
                    <p
                      className={
                        'text-xs mt-1 ' +
                        (selectedOrder.saleId ? 'text-emerald-600' : 'text-amber-600')
                      }
                    >
                      Method: {selectedOrder.paymentMethod}
                    </p>
                  </div>
                  {selectedOrder.saleId && (
                    <div className="text-right">
                      <p className="text-sm font-semibold text-emerald-800 flex items-center gap-1 justify-end">
                        <FiCheckCircle className="mr-1" /> Sale Completed
                      </p>
                      <p className="text-xs text-emerald-600 mt-1 font-mono">
                        ID:{' '}
                        {typeof selectedOrder.saleId === 'string'
                          ? selectedOrder.saleId.slice(-8).toUpperCase()
                          : String(selectedOrder.saleId._id || selectedOrder.saleId).slice(-8).toUpperCase()}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer actions */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex flex-wrap justify-end gap-3 items-center">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-lg shadow-sm hover:bg-slate-50"
              >
                Close
              </button>

              {/* Payment + sale flow (only when sale not yet created) */}
              {!selectedOrder.saleId && (
                <>
                  {selectedOrder.paymentMethod === 'COD' && !isCodCollected && (
                    <button
                      onClick={() => setIsCodCollected(true)}
                      className="px-4 py-2 text-sm font-medium text-emerald-700 bg-emerald-100 rounded-lg hover:bg-emerald-200 transition-colors shadow-sm"
                    >
                      Confirm Payment Collected
                    </button>
                  )}
                  <button
                    onClick={handleConfirmSale}
                    disabled={
                      confirmLoading ||
                      (selectedOrder.paymentMethod === 'COD' && !isCodCollected)
                    }
                    className="px-4 py-2 text-sm font-medium text-white bg-brandPrimary rounded-lg shadow-sm hover:bg-brandPrimary/90 disabled:opacity-50 flex items-center gap-2"
                  >
                    {confirmLoading && <Spinner size="sm" />}
                    Confirm Payment &amp; Complete Sale
                  </button>
                </>
              )}

              {/* Fulfilment action button (only visible once sale is created) */}
              {selectedOrder.saleId && NEXT_STATUS[selectedOrder.status] && (() => {
                const ActionIcon = ACTION_ICON[selectedOrder.status] || FiChevronRight;
                return (
                  <button
                    onClick={() => handleStatusActionClick(selectedOrder, null)}
                    className="px-4 py-2 text-sm font-medium text-white bg-brandPrimary rounded-lg shadow-sm hover:bg-brandPrimary/90 flex items-center gap-2"
                  >
                    <ActionIcon size={15} />
                    {ACTION_LABEL[selectedOrder.status]}
                  </button>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Status-update confirmation dialog */}
      {confirmDialog && (
        <StatusConfirmDialog
          order={confirmDialog.order}
          nextStatus={confirmDialog.nextStatus}
          loading={statusUpdateLoading}
          onConfirm={handleStatusUpdateConfirm}
          onCancel={() => setConfirmDialog(null)}
        />
      )}
    </div>
  );
};

export default CustomerOrders;
