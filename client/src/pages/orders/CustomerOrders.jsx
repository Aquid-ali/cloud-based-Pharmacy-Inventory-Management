import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FiShoppingBag, FiClock, FiTruck, FiCheckCircle } from 'react-icons/fi';
import PageHeader from '../../components/PageHeader';
import StatCard from '../../components/StatCard';
import DataTable from '../../components/DataTable';
import Spinner from '../../components/Spinner';
import { getStoreOrders, updateOrderStatus } from '../../services/orderService';

const STATUS_OPTIONS = ['Placed', 'Processing', 'Out for Delivery', 'Delivered', 'Cancelled'];

const CustomerOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const handleStatusChange = async (orderId, status) => {
    try {
      await updateOrderStatus(orderId, status);
      toast.success('Order status updated');
      setOrders((prev) => prev.map((o) => (o._id === orderId ? { ...o, status } : o)));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update order status');
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
        <select
          value={row.status}
          onChange={(e) => handleStatusChange(row._id, e.target.value)}
          className="text-xs font-medium border border-slate-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:border-[#346560] cursor-pointer"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
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
          bgTint="bg-[#346560]/10"
          iconColor="text-[#346560]"
          borderColor="border-[#346560]/20"
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
        />
      )}
    </div>
  );
};

export default CustomerOrders;
