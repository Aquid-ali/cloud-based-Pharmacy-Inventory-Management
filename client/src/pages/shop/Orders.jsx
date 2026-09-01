import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiChevronRight } from 'react-icons/fi';
import { getMyOrders } from '../../services/orderService';
import EmptyState from '../../components/EmptyState';
import { SkeletonRows } from '../../components/Skeleton';
import { statusTint } from '../../utils/orderStatus';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const { data } = await getMyOrders();
        setOrders(data.data.orders);
      } catch (error) {
        toast.error('Failed to load orders');
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  return (
    <div className="space-y-5 max-w-3xl">
      <h1 className="text-xl font-bold font-serif text-ink">My orders</h1>

      {loading ? (
        <SkeletonRows count={4} />
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm">
          <EmptyState title="No orders yet" message="Your placed orders will show up here." />
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Link
              key={order._id}
              to={`/shop/orders/${order._id}`}
              className="flex items-center gap-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-ink">
                  #{order._id.slice(-8).toUpperCase()}
                </p>
                <p className="text-xs text-ink-faint mt-0.5">
                  {new Date(order.createdAt).toLocaleDateString()} · {order.items.length} item{order.items.length > 1 ? 's' : ''}
                </p>
              </div>
              <span className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold border ${statusTint[order.status] || ''}`}>
                {order.status}
              </span>
              <span className="shrink-0 text-sm font-semibold text-ink w-20 text-right">
                ₹{order.pricing.totalAmount.toFixed(2)}
              </span>
              <FiChevronRight className="text-slate-300 shrink-0" size={18} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Orders;
