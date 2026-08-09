import React, { useState } from 'react';
import { FiShoppingCart, FiPlus, FiTrash2, FiCreditCard } from 'react-icons/fi';
import PageHeader from '../../components/PageHeader';
import { posCartItems } from '../../config/mockData';
import toast from 'react-hot-toast';

const POSBilling = () => {
  const [cart, setCart] = useState(posCartItems);
  const [payment, setPayment] = useState('Cash');

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const tax = Math.round(subtotal * 0.18);
  const total = subtotal + tax;

  const updateQty = (id, delta) => {
    setCart((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, qty: Math.max(1, item.qty + delta) } : item
      )
    );
  };

  const removeItem = (id) => setCart((prev) => prev.filter((item) => item.id !== id));

  const handleCheckout = () => {
    toast.success(`Payment of ₹${total} processed via ${payment}`);
    setCart([]);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="POS Billing"
        description="Point of sale — scan or search medicines to create invoices."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-5">
            <div className="flex gap-3 mb-4">
              <input
                type="text"
                placeholder="Search medicine by name or barcode..."
                className="flex-1 px-4 py-2.5 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#346560]/20 focus:border-[#346560]"
              />
              <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#346560] text-white rounded-2xl text-sm font-semibold hover:bg-[#2a524e] transition-colors">
                <FiPlus size={16} />
                Add
              </button>
            </div>

            {cart.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <FiShoppingCart size={40} className="mx-auto mb-3 opacity-40" />
                <p className="text-sm">Cart is empty. Search and add medicines.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {cart.map((item) => (
                  <div key={item.id} className="flex items-center justify-between py-4">
                    <div>
                      <p className="font-semibold text-slate-800 text-sm">{item.name}</p>
                      <p className="text-xs text-slate-500">₹{item.price} each</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-2 py-1">
                        <button onClick={() => updateQty(item.id, -1)} className="w-7 h-7 rounded-lg hover:bg-slate-200 text-slate-600 font-bold">−</button>
                        <span className="w-6 text-center text-sm font-semibold">{item.qty}</span>
                        <button onClick={() => updateQty(item.id, 1)} className="w-7 h-7 rounded-lg hover:bg-slate-200 text-slate-600 font-bold">+</button>
                      </div>
                      <span className="font-bold text-slate-800 w-16 text-right">₹{item.price * item.qty}</span>
                      <button onClick={() => removeItem(item.id)} className="text-rose-400 hover:text-rose-600">
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6">
            <h3 className="font-serif font-bold text-slate-800 mb-4">Order Summary</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-slate-600"><span>Subtotal</span><span>₹{subtotal}</span></div>
              <div className="flex justify-between text-slate-600"><span>GST (18%)</span><span>₹{tax}</span></div>
              <div className="border-t border-slate-100 pt-3 flex justify-between font-bold text-lg text-slate-900">
                <span>Total</span><span>₹{total}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6">
            <h3 className="font-serif font-bold text-slate-800 mb-4">Payment Method</h3>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {['Cash', 'UPI', 'Card'].map((method) => (
                <button
                  key={method}
                  onClick={() => setPayment(method)}
                  className={`py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                    payment === method
                      ? 'bg-[#346560] text-white'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {method}
                </button>
              ))}
            </div>
            <button
              onClick={handleCheckout}
              disabled={cart.length === 0}
              className="w-full inline-flex items-center justify-center gap-2 py-3 bg-[#4ecdc4] text-[#1c3734] rounded-2xl text-sm font-bold hover:bg-[#3dbdb5] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <FiCreditCard size={16} />
              Complete Sale — ₹{total}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default POSBilling;
