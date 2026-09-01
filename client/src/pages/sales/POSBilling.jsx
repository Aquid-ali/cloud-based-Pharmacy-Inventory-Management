import React, { useEffect, useRef, useState } from 'react';
import { FiShoppingCart, FiTrash2, FiCreditCard, FiSearch, FiLoader } from 'react-icons/fi';
import toast from 'react-hot-toast';
import PageHeader from '../../components/PageHeader';
import useAuth from '../../hooks/useAuth';
import { getMedicines } from '../../services/medicineService';
import { searchCatalogMedicines } from '../../services/medicineCatalogService';
import { getInventoryItems } from '../../services/inventoryService';
import { createSale } from '../../services/saleService';

const DEBOUNCE_MS = 300;
const GST_RATE = 0.18;

const POSBilling = () => {
  const { user } = useAuth();
  const isPharmacyAdmin = !!user?.pharmacyId;

  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [resolvingId, setResolvingId] = useState(null);
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [payment, setPayment] = useState('Cash');
  const [submitting, setSubmitting] = useState(false);

  const debounceRef = useRef(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setSearching(false);
      return undefined;
    }
    setSearching(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const { data } = isPharmacyAdmin
          ? await searchCatalogMedicines({ q: query, limit: 8 })
          : await getMedicines({ search: query, limit: 8 });
        setResults(data.data.medicines);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, DEBOUNCE_MS);
    return () => clearTimeout(debounceRef.current);
  }, [query, isPharmacyAdmin]);

  const addStoreItem = (item) => {
    if (item.status === 'Expired' || item.quantity <= 0) {
      toast.error(`${item.medicineName} is not available for sale`);
      return;
    }
    setCart((prev) => {
      const existing = prev.find((c) => c.medicineId === item._id);
      if (existing) {
        return prev.map((c) =>
          c.medicineId === item._id ? { ...c, qty: Math.min(c.qty + 1, item.quantity) } : c
        );
      }
      return [...prev, { medicineId: item._id, name: item.medicineName, price: item.sellingPrice, qty: 1, maxQty: item.quantity }];
    });
    setQuery('');
    setResults([]);
  };

  const addCatalogItem = async (item) => {
    setResolvingId(item._id);
    try {
      const { data } = await getInventoryItems({ medicineId: item._id, limit: 50 });
      const batches = (data.data.inventory || []).filter((b) => b.status !== 'Expired' && b.quantity > 0);
      if (batches.length === 0) {
        toast.error(`${item.name} is not in stock at your pharmacy`);
        return;
      }
      const cheapest = batches.reduce((best, b) => (b.sellingPrice < best.sellingPrice ? b : best));
      const totalAvailable = batches.reduce((sum, b) => sum + b.quantity, 0);
      setCart((prev) => {
        const existing = prev.find((c) => c.medicineId === item._id);
        if (existing) {
          return prev.map((c) =>
            c.medicineId === item._id ? { ...c, qty: Math.min(c.qty + 1, totalAvailable) } : c
          );
        }
        return [...prev, { medicineId: item._id, name: item.name, price: cheapest.sellingPrice, qty: 1, maxQty: totalAvailable }];
      });
      setQuery('');
      setResults([]);
    } catch {
      toast.error('Failed to check pharmacy stock for this medicine');
    } finally {
      setResolvingId(null);
    }
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const tax = Math.round(subtotal * GST_RATE);
  const total = subtotal + tax;

  const updateQty = (medicineId, delta) => {
    setCart((prev) =>
      prev.map((item) =>
        item.medicineId === medicineId
          ? { ...item, qty: Math.min(item.maxQty, Math.max(1, item.qty + delta)) }
          : item
      )
    );
  };

  const removeItem = (medicineId) => setCart((prev) => prev.filter((item) => item.medicineId !== medicineId));

  const handleCheckout = async () => {
    setSubmitting(true);
    try {
      await createSale({
        items: cart.map((item) => ({ medicineId: item.medicineId, quantity: item.qty })),
        paymentMethod: payment,
        customerName: customerName.trim() || undefined,
      });
      toast.success(`Sale of ₹${total} recorded`);
      setCart([]);
      setCustomerName('');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to record sale');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="POS Billing"
        description="Point of sale — search medicines to build an invoice. Completing a sale updates stock immediately."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-5">
            <div className="relative mb-4">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search medicine by name..."
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#346560]/20 focus:border-[#346560]"
              />
              {query.trim() && (
                <div className="absolute z-10 mt-2 w-full bg-white rounded-2xl border border-slate-200/80 shadow-lg max-h-72 overflow-y-auto">
                  {searching ? (
                    <div className="p-4 text-xs text-slate-400 flex items-center gap-2">
                      <FiLoader className="animate-spin" size={14} /> Searching...
                    </div>
                  ) : results.length === 0 ? (
                    <div className="p-4 text-xs text-slate-400">No medicines found.</div>
                  ) : (
                    <ul className="divide-y divide-slate-100">
                      {results.map((item) => (
                        <li key={item._id}>
                          <button
                            type="button"
                            disabled={resolvingId === item._id}
                            onClick={() => (isPharmacyAdmin ? addCatalogItem(item) : addStoreItem(item))}
                            className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center justify-between gap-3 disabled:opacity-50"
                          >
                            <div>
                              <p className="text-sm font-medium text-slate-800">
                                {isPharmacyAdmin ? item.name : item.medicineName}
                              </p>
                              <p className="text-xs text-slate-400">{item.manufacturer}</p>
                            </div>
                            {!isPharmacyAdmin && (
                              <span className="text-xs font-semibold text-slate-600 shrink-0">
                                ₹{item.sellingPrice?.toFixed(2)} · {item.quantity} in stock
                              </span>
                            )}
                            {isPharmacyAdmin && resolvingId === item._id && (
                              <FiLoader className="animate-spin text-slate-400 shrink-0" size={14} />
                            )}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            {cart.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <FiShoppingCart size={40} className="mx-auto mb-3 opacity-40" />
                <p className="text-sm">Cart is empty. Search and add medicines.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {cart.map((item) => (
                  <div key={item.medicineId} className="flex items-center justify-between py-4">
                    <div>
                      <p className="font-semibold text-slate-800 text-sm">{item.name}</p>
                      <p className="text-xs text-slate-500">₹{item.price.toFixed(2)} each</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-2 py-1">
                        <button onClick={() => updateQty(item.medicineId, -1)} className="w-7 h-7 rounded-lg hover:bg-slate-200 text-slate-600 font-bold">−</button>
                        <span className="w-6 text-center text-sm font-semibold">{item.qty}</span>
                        <button onClick={() => updateQty(item.medicineId, 1)} className="w-7 h-7 rounded-lg hover:bg-slate-200 text-slate-600 font-bold">+</button>
                      </div>
                      <span className="font-bold text-slate-800 w-20 text-right">₹{(item.price * item.qty).toFixed(2)}</span>
                      <button onClick={() => removeItem(item.medicineId)} className="text-rose-400 hover:text-rose-600">
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
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Customer name (optional)"
              className="w-full mb-4 px-4 py-2.5 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#346560]/20 focus:border-[#346560]"
            />
            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-slate-600"><span>Subtotal</span><span>₹{subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between text-slate-600"><span>GST (18%)</span><span>₹{tax}</span></div>
              <div className="border-t border-slate-100 pt-3 flex justify-between font-bold text-lg text-slate-900">
                <span>Total</span><span>₹{total.toFixed(2)}</span>
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
              disabled={cart.length === 0 || submitting}
              className="w-full inline-flex items-center justify-center gap-2 py-3 bg-[#4ecdc4] text-[#1c3734] rounded-2xl text-sm font-bold hover:bg-[#3dbdb5] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {submitting ? <FiLoader className="animate-spin" size={16} /> : <FiCreditCard size={16} />}
              {submitting ? 'Recording sale...' : `Complete Sale — ₹${total.toFixed(2)}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default POSBilling;
