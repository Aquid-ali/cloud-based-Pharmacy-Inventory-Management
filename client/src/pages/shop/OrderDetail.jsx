import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiCheckCircle, FiTruck, FiMapPin, FiCreditCard, FiArrowLeft } from 'react-icons/fi';
import { TbPill } from 'react-icons/tb';
import { getOrderById } from '../../services/orderService';
import EmptyState from '../../components/EmptyState';
import OrderTimeline from '../../components/OrderTimeline';
import { SkeletonDetail } from '../../components/Skeleton';
import { statusTint } from '../../utils/orderStatus';

const OrderDetail = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      setLoading(true);
      try {
        const { data } = await getOrderById(id);
        setOrder(data.data.order);
      } catch (error) {
        toast.error('Order not found');
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id]);

  if (loading) return <SkeletonDetail />;

  if (!order) {
    return (
      <div className="space-y-4 max-w-3xl">
        <Link to="/shop/orders" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-tealPrimary">
          <FiArrowLeft size={14} /> Back to my orders
        </Link>
        <div className="bg-white rounded-3xl border border-slate-200/80">
          <EmptyState title="Order not found" message="This order may have been removed or the link is incorrect." />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-3xl">
      <Link to="/shop/orders" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-tealPrimary">
        <FiArrowLeft size={14} /> Back to my orders
      </Link>

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <FiCheckCircle size={22} />
            </div>
            <div>
              <h1 className="text-lg font-bold font-serif text-ink">Order placed</h1>
              <p className="text-xs text-ink-faint">
                #{order._id.slice(-8).toUpperCase()} · {new Date(order.createdAt).toLocaleString()}
              </p>
            </div>
          </div>
          <span className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border ${statusTint[order.status] || ''}`}>
            {order.status}
          </span>
        </div>

        <div className="mb-6 pb-6 border-b border-slate-100 overflow-x-auto">
          <OrderTimeline status={order.status} />
        </div>

        {/* Items */}
        <div className="space-y-3 mb-6">
          {order.items.map((item, idx) => (
            <div key={item.inventoryItem || item.medicine || idx} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-50 text-tealPrimary flex items-center justify-center shrink-0">
                <TbPill className="w-5 h-5 transform -rotate-45" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-ink truncate">{item.medicineName}</p>
                <p className="text-xs text-ink-faint">Qty {item.quantity} × ₹{item.sellingPrice.toFixed(2)}</p>
              </div>
              <span className="text-sm font-semibold text-ink">₹{item.lineTotal.toFixed(2)}</span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 border-t border-slate-100 pt-6">
          {/* Delivery/Pickup info */}
          <div>
            <h2 className="text-xs font-semibold text-ink-soft uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <FiTruck size={13} /> {order.deliveryType}
            </h2>
            {order.deliveryType === 'Delivery' && order.address ? (
              <p className="text-sm text-ink-soft leading-relaxed">
                {order.address.fullName}<br />
                {order.address.line1}, {order.address.city}, {order.address.state} {order.address.pincode}<br />
                {order.address.phone}
              </p>
            ) : order.pharmacy ? (
              <p className="text-sm text-ink-soft leading-relaxed flex items-start gap-1.5">
                <FiMapPin size={14} className="mt-0.5 shrink-0" />
                <span>
                  {order.pharmacy.name}<br />
                  {order.pharmacy.address}, {order.pharmacy.city}
                </span>
              </p>
            ) : order.store ? (
              <p className="text-sm text-ink-soft leading-relaxed flex items-start gap-1.5">
                <FiMapPin size={14} className="mt-0.5 shrink-0" />
                <span>
                  {order.store.name}<br />
                  {order.store.address.line1}, {order.store.address.city}
                </span>
              </p>
            ) : null}
          </div>

          {/* Payment summary */}
          <div>
            <h2 className="text-xs font-semibold text-ink-soft uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <FiCreditCard size={13} /> Payment summary
            </h2>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-ink-soft">
                <span>Subtotal</span>
                <span>₹{order.pricing.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-ink-soft">
                <span>Delivery fee</span>
                <span>{order.pricing.deliveryFee === 0 ? 'Free' : `₹${order.pricing.deliveryFee.toFixed(2)}`}</span>
              </div>
              <div className="flex justify-between font-semibold text-ink border-t border-slate-100 pt-1.5">
                <span>Total</span>
                <span>₹{order.pricing.totalAmount.toFixed(2)}</span>
              </div>
              <p className="text-xs text-ink-faint pt-1">
                {order.paymentMethod} · {order.paymentStatus}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;
