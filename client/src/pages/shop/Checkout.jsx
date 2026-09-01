import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiTruck, FiMapPin, FiCreditCard, FiCheck } from 'react-icons/fi';
import useCart from '../../hooks/useCart';
import useAuth from '../../hooks/useAuth';
import { createOrder } from '../../services/orderService';
import FormField from '../../components/FormField';
import Button from '../../components/Button';

const FREE_DELIVERY_THRESHOLD = 500;
const DELIVERY_FEE = 40;

const emptyAddress = { fullName: '', phone: '', line1: '', city: '', state: '', pincode: '' };

const paymentOptions = [
  { value: 'COD', label: 'Cash on Delivery', hint: 'Pay when your order arrives' },
  { value: 'UPI', label: 'UPI', hint: 'Simulated payment — no real charge' },
  { value: 'Card', label: 'Card', hint: 'Simulated payment — no real charge' },
];

const Checkout = () => {
  const { items, subtotal, clear, pharmacyId, pharmacyName } = useCart();
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();

  const [deliveryType, setDeliveryType] = useState('Delivery');
  const [address, setAddress] = useState(
    user?.addresses?.find((a) => a.isDefault) || user?.addresses?.[0] || emptyAddress
  );
  const [saveAddress, setSaveAddress] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [placing, setPlacing] = useState(false);

  if (items.length === 0) {
    return <Navigate to="/shop/cart" replace />;
  }

  const deliveryFee = deliveryType === 'Delivery' && subtotal < FREE_DELIVERY_THRESHOLD ? DELIVERY_FEE : 0;
  const total = subtotal + deliveryFee;
  const limitedItems = items.filter((i) => i.maxQuantity != null && i.quantity >= i.maxQuantity);

  const handleAddressChange = (e) => {
    setAddress({ ...address, [e.target.name]: e.target.value });
  };

  const validate = () => {
    if (deliveryType === 'Delivery') {
      const required = ['fullName', 'phone', 'line1', 'city', 'state', 'pincode'];
      for (const field of required) {
        if (!address[field]?.trim()) {
          toast.error('Please fill in your complete delivery address');
          return false;
        }
      }
    }
    return true;
  };

  const handlePlaceOrder = async () => {
    if (!validate()) return;
    setPlacing(true);
    try {
      if (saveAddress && deliveryType === 'Delivery') {
        await updateProfile({ addresses: [{ ...address, isDefault: true }] });
      }

      const { data } = await createOrder({
        items: items.map((i) => ({ medicineId: i.medicineId, quantity: i.quantity })),
        deliveryType,
        address: deliveryType === 'Delivery' ? address : undefined,
        pharmacyId,
        paymentMethod,
      });

      clear();
      toast.success('Order placed!');
      navigate(`/shop/orders/${data.data.order._id}`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to place order');
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-5">
        <h1 className="text-xl font-bold font-serif text-ink">Checkout</h1>

        {/* Fulfilling store */}
        <div className="flex items-center gap-2 bg-primary-50 border border-tealPrimary/15 text-tealPrimary text-xs font-medium rounded-2xl px-4 py-3">
          <FiMapPin size={14} className="shrink-0" />
          Fulfilled by <span className="font-semibold">{pharmacyName}</span>
        </div>

        {limitedItems.length > 0 && (
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-2xl px-4 py-3">
            <span>
              {limitedItems.length === 1 ? 'One item' : `${limitedItems.length} items`} in your cart {limitedItems.length === 1 ? 'was' : 'were'} at
              the maximum quantity available when added — actual stock may have changed since then.
            </span>
          </div>
        )}

        {/* Delivery vs Pickup */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-ink mb-3 flex items-center gap-2">
            <FiTruck size={16} /> How would you like your order?
          </h2>
          <div className="flex gap-2">
            {['Delivery', 'Pickup'].map((type) => (
              <button
                key={type}
                onClick={() => setDeliveryType(type)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                  deliveryType === type
                    ? 'bg-tealPrimary text-white border-tealPrimary'
                    : 'bg-white text-ink-soft border-slate-200 hover:border-tealPrimary/40'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Address (Delivery only — Pickup already has a fixed store above) */}
        {deliveryType === 'Delivery' && (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5">
            <h2 className="text-sm font-semibold text-ink mb-3 flex items-center gap-2">
              <FiMapPin size={16} /> Delivery address
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField name="fullName" value={address.fullName} onChange={handleAddressChange} placeholder="Full name" />
              <FormField name="phone" value={address.phone} onChange={handleAddressChange} placeholder="Phone number" />
              <FormField
                name="line1"
                value={address.line1}
                onChange={handleAddressChange}
                placeholder="Address line"
                className="sm:col-span-2"
              />
              <FormField name="city" value={address.city} onChange={handleAddressChange} placeholder="City" />
              <FormField name="state" value={address.state} onChange={handleAddressChange} placeholder="State" />
              <FormField name="pincode" value={address.pincode} onChange={handleAddressChange} placeholder="Pincode" />
            </div>
            <label className="flex items-center gap-2 mt-3 text-xs text-ink-soft">
              <input type="checkbox" checked={saveAddress} onChange={(e) => setSaveAddress(e.target.checked)} />
              Save this address to my account
            </label>
          </div>
        )}

        {/* Payment method */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-ink mb-3 flex items-center gap-2">
            <FiCreditCard size={16} /> Payment method
          </h2>
          <div className="space-y-2">
            {paymentOptions.map((opt) => (
              <label
                key={opt.value}
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                  paymentMethod === opt.value ? 'border-tealPrimary bg-primary-50' : 'border-slate-200'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  checked={paymentMethod === opt.value}
                  onChange={() => setPaymentMethod(opt.value)}
                />
                <div>
                  <p className="text-sm font-medium text-ink">{opt.label}</p>
                  <p className="text-[11px] text-ink-faint">{opt.hint}</p>
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Payment Summary */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 h-fit sticky top-24">
        <h2 className="text-sm font-semibold text-ink mb-4">Payment summary</h2>
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between text-ink-soft">
            <span>Subtotal ({items.length} item{items.length > 1 ? 's' : ''})</span>
            <span className="font-medium text-ink">₹{subtotal.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between text-ink-soft">
            <span>Delivery fee</span>
            <span className="font-medium text-ink">
              {deliveryFee === 0 ? 'Free' : `₹${deliveryFee.toFixed(2)}`}
            </span>
          </div>
          <div className="border-t border-slate-100 pt-2 flex items-center justify-between font-semibold text-ink">
            <span>Total</span>
            <span>₹{total.toFixed(2)}</span>
          </div>
        </div>

        <Button
          onClick={handlePlaceOrder}
          loading={placing}
          icon={FiCheck}
          size="lg"
          className="w-full mt-5"
        >
          {placing ? 'Placing order...' : 'Place Order'}
        </Button>
      </div>
    </div>
  );
};

export default Checkout;
