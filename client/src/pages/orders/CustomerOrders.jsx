import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FiShoppingBag, FiClock, FiTruck, FiCheckCircle, FiX } from 'react-icons/fi';
import PageHeader from '../../components/PageHeader';
import StatCard from '../../components/StatCard';
import DataTable from '../../components/DataTable';
import Spinner from '../../components/Spinner';
import { getStoreOrders, confirmOrderSale } from '../../services/orderService';

const CustomerOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);

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
    setIsModalOpen(true);
  };

  const handleConfirmSale = async () => {
    if (!selectedOrder) return;
    setConfirmLoading(true);
    try {
      const res = await confirmOrderSale(selectedOrder._id);
      toast.success('Payment confirmed and sale completed successfully.');
      setOrders((prev) => prev.map((o) => (o._id === selectedOrder._id ? res.data.data.order : o)));
      setSelectedOrder(res.data.data.order);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to complete sale');
    } finally {
      setConfirmLoading(false);
    }
  };

  const columns = [
    { key: 'id', label: 'Order', render: (row) => <span className="font-mono text-xs">#{row._id.slice(-8).toUpperCase()}</span> },
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
    { key: 'items', label: 'Items', render: (row) => `${row.items.length} item${row.items.length > 1 ? 's' : ''}` },
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
    { key: 'total', label: 'Total', render: (row) => `₹${row.pricing.totalAmount.toFixed(2)}` },
    { key: 'createdAt', label: 'Placed', render: (row) => new Date(row.createdAt).toLocaleDateString() },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <span className={`text-xs font-medium border rounded-lg px-2 py-1 bg-white ${
          row.status === 'Processing' ? 'text-amber-700 border-amber-200' : 
          row.status === 'Delivered' ? 'text-emerald-700 border-emerald-200' : 
          'text-slate-700 border-slate-200'
        }`}>
          {row.status}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customer Orders"
        description="Orders placed by customers shopping from your store."
      />

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
          label="Processing"
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

      {/* Order POS Modal */}
      {isModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="text-lg font-semibold text-slate-800">Order #{selectedOrder._id.slice(-8).toUpperCase()}</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-50">
                <FiX size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <h4 className="text-sm font-semibold text-slate-700 mb-2">Customer Details</h4>
                <p className="text-sm text-slate-600 font-medium">{selectedOrder.user?.fullName}</p>
                <p className="text-sm text-slate-500">{selectedOrder.user?.email}</p>
                {selectedOrder.address && (
                  <p className="text-sm text-slate-500 mt-2">
                    {selectedOrder.address.line1}, {selectedOrder.address.city}, {selectedOrder.address.state} {selectedOrder.address.pincode}
                  </p>
                )}
              </div>

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
                          <td className="px-4 py-3 text-slate-700 text-right">₹{item.sellingPrice.toFixed(2)}</td>
                          <td className="px-4 py-3 text-slate-700 text-right font-medium">₹{item.lineTotal.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-end">
                <div className="w-64 space-y-2 text-sm">
                  <div className="flex justify-between text-slate-500">
                    <span>Subtotal</span>
                    <span>₹{selectedOrder.pricing.subtotal.toFixed(2)}</span>
                  </div>
                  {selectedOrder.pricing.deliveryFee > 0 && (
                    <div className="flex justify-between text-slate-500">
                      <span>Delivery Fee</span>
                      <span>₹{selectedOrder.pricing.deliveryFee.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-semibold text-slate-800 pt-2 border-t border-slate-100">
                    <span>Total</span>
                    <span>₹{selectedOrder.pricing.totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              
              <div className={`p-4 rounded-xl border ${selectedOrder.saleId ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50 border-amber-100'}`}>
                <div className="flex justify-between items-center">
                  <div>
                    <p className={`text-sm font-semibold ${selectedOrder.saleId ? 'text-emerald-800' : 'text-amber-800'}`}>
                      Payment: {selectedOrder.paymentStatus}
                    </p>
                    <p className={`text-xs mt-1 ${selectedOrder.saleId ? 'text-emerald-600' : 'text-amber-600'}`}>
                      Method: {selectedOrder.paymentMethod}
                    </p>
                  </div>
                  {selectedOrder.saleId && (
                    <div className="text-right">
                      <p className="text-sm font-semibold text-emerald-800 flex items-center gap-1 justify-end">
                        <FiCheckCircle className="mr-1" /> Sale Completed
                      </p>
                      <p className="text-xs text-emerald-600 mt-1 font-mono">ID: {selectedOrder.saleId.slice(-8).toUpperCase()}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-lg shadow-sm hover:bg-slate-50"
              >
                Close
              </button>
              {!selectedOrder.saleId && (
                <button
                  onClick={handleConfirmSale}
                  disabled={confirmLoading}
                  className="px-4 py-2 text-sm font-medium text-white bg-brandPrimary rounded-lg shadow-sm hover:bg-brandPrimary/90 disabled:opacity-50 flex items-center gap-2"
                >
                  {confirmLoading && <Spinner size="sm" />}
                  Confirm Payment & Complete Sale
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerOrders;
