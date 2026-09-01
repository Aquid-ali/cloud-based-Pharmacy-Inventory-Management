import React, { createContext, useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import useAuth from '../hooks/useAuth';

export const CartContext = createContext(null);

const cartKey = (userId) => `medichain_cart_${userId || 'guest'}`;
const emptyCart = { pharmacyId: null, pharmacyName: null, items: [] };

// Older sessions stored the cart as a plain items array. Normalize whatever
// comes out of localStorage (old array shape, malformed JSON, etc.) so a
// stale value can never crash the app.
const readCart = (storageKey) => {
  try {
    const stored = localStorage.getItem(storageKey);
    if (!stored) return emptyCart;
    const parsed = JSON.parse(stored);
    if (Array.isArray(parsed)) return { ...emptyCart, items: parsed };
    if (parsed && Array.isArray(parsed.items)) return { ...emptyCart, ...parsed };
    return emptyCart;
  } catch {
    return emptyCart;
  }
};

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const storageKey = cartKey(user?._id);

  const [cart, setCart] = useState(() => readCart(storageKey));

  // Reload the cart whenever the signed-in user changes (so carts don't leak across accounts)
  useEffect(() => {
    setCart(readCart(storageKey));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(cart));
  }, [cart, storageKey]);

  // Switching pharmacies clears the cart, since stock/pricing is per-pharmacy.
  const selectPharmacy = (pharmacy) => {
    if (cart.pharmacyId && cart.pharmacyId !== pharmacy._id && cart.items.length > 0) {
      const confirmed = window.confirm(
        `Your cart has items from ${cart.pharmacyName}. Switching to ${pharmacy.name} will clear it. Continue?`
      );
      if (!confirmed) return false;
    }
    setCart({ pharmacyId: pharmacy._id, pharmacyName: pharmacy.name, items: [] });
    return true;
  };

  const addItem = (medicine, quantity = 1) => {
    setCart((prev) => {
      const existing = prev.items.find((i) => i.medicineId === medicine._id);
      const items = existing
        ? prev.items.map((i) =>
            i.medicineId === medicine._id ? { ...i, quantity: i.quantity + quantity } : i
          )
        : [
            ...prev.items,
            {
              medicineId: medicine._id,
              medicineName: medicine.medicineName,
              sellingPrice: medicine.sellingPrice,
              manufacturer: medicine.manufacturer,
              maxQuantity: medicine.quantity,
              quantity,
            },
          ];
      return { ...prev, items };
    });
    toast.success(`${medicine.medicineName} added to cart`);
  };

  const updateQty = (medicineId, quantity) => {
    if (quantity < 1) return;
    setCart((prev) => ({
      ...prev,
      items: prev.items.map((i) => (i.medicineId === medicineId ? { ...i, quantity } : i)),
    }));
  };

  const removeItem = (medicineId) => {
    setCart((prev) => ({ ...prev, items: prev.items.filter((i) => i.medicineId !== medicineId) }));
  };

  const clear = () => setCart(emptyCart);

  // Deselects the current pharmacy so the shop goes back to showing medicines
  // from every pharmacy, mirroring selectPharmacy's confirm-before-losing-items
  // behavior since cart items are pharmacy-specific and can't survive "no pharmacy" either.
  const clearPharmacy = () => {
    if (cart.pharmacyId && cart.items.length > 0) {
      const confirmed = window.confirm(
        `Your cart has items from ${cart.pharmacyName}. Browsing all pharmacies will clear it. Continue?`
      );
      if (!confirmed) return false;
    }
    setCart(emptyCart);
    return true;
  };

  const subtotal = useMemo(
    () => cart.items.reduce((sum, i) => sum + i.sellingPrice * i.quantity, 0),
    [cart.items]
  );

  const count = useMemo(() => cart.items.reduce((sum, i) => sum + i.quantity, 0), [cart.items]);

  return (
    <CartContext.Provider
      value={{
        pharmacyId: cart.pharmacyId,
        pharmacyName: cart.pharmacyName,
        items: cart.items,
        selectPharmacy,
        clearPharmacy,
        addItem,
        updateQty,
        removeItem,
        clear,
        subtotal,
        count,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
