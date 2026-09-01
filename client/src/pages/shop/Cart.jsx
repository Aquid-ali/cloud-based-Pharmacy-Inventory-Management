import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiMinus, FiPlus, FiTrash2, FiShoppingBag } from 'react-icons/fi';
import { TbPill } from 'react-icons/tb';
import useCart from '../../hooks/useCart';
import EmptyState from '../../components/EmptyState';
import Button from '../../components/Button';

const Cart = () => {
  const { items, updateQty, removeItem, subtotal } = useCart();
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto bg-white rounded-3xl border border-slate-200/80 shadow-sm">
        <EmptyState
          title="Your cart is waiting"
          message="Search for medicines and add them to your cart to get started."
        />
        <div className="pb-8 flex justify-center">
          <Button to="/shop/search">Browse medicines</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-3">
        <h1 className="text-xl font-bold font-serif text-ink mb-2">Your cart</h1>
        {items.map((item) => (
          <div
            key={item.medicineId}
            className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 flex items-center gap-4"
          >
            <div className="w-14 h-14 rounded-xl bg-primary-50 text-tealPrimary flex items-center justify-center shrink-0">
              <TbPill className="w-6 h-6 transform -rotate-45" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-ink truncate">{item.medicineName}</p>
              <p className="text-xs text-ink-faint">{item.manufacturer}</p>
              <p className="text-sm font-semibold text-ink mt-1">₹{item.sellingPrice.toFixed(2)}</p>
              {item.maxQuantity != null && item.quantity >= item.maxQuantity && (
                <p className="text-[11px] text-amber-600 mt-0.5">
                  Only {item.maxQuantity} were available when added
                </p>
              )}
            </div>
            <div className="flex items-center border border-slate-200 rounded-xl">
              <button
                onClick={() => updateQty(item.medicineId, item.quantity - 1)}
                className="p-2.5 text-slate-500 hover:text-tealPrimary"
              >
                <FiMinus size={13} />
              </button>
              <span className="w-7 text-center text-sm font-semibold">{item.quantity}</span>
              <button
                onClick={() => updateQty(item.medicineId, Math.min(item.maxQuantity, item.quantity + 1))}
                className="p-2.5 text-slate-500 hover:text-tealPrimary"
              >
                <FiPlus size={13} />
              </button>
            </div>
            <button
              onClick={() => removeItem(item.medicineId)}
              className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors shrink-0"
            >
              <FiTrash2 size={16} />
            </button>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 h-fit sticky top-24">
        <h2 className="text-sm font-semibold text-ink mb-4">Order summary</h2>
        <div className="flex items-center justify-between text-sm text-ink-soft mb-2">
          <span>Subtotal</span>
          <span className="font-medium text-ink">₹{subtotal.toFixed(2)}</span>
        </div>
        <p className="text-[11px] text-ink-faint mb-4">Delivery fee and total calculated at checkout.</p>
        <Button onClick={() => navigate('/shop/checkout')} icon={FiShoppingBag} size="lg" className="w-full">
          Proceed to Checkout
        </Button>
      </div>
    </div>
  );
};

export default Cart;
