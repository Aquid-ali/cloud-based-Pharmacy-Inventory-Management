import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { FiPackage, FiSearch, FiX } from 'react-icons/fi';
import Modal from '../Modal';
import Button from '../Button';
import FormField from '../FormField';
import { SkeletonRows } from '../Skeleton';
import { getInventoryItems } from '../../services/inventoryService';

/**
 * Lets the sender attach a structured "Product Request" referencing one of
 * THEIR OWN inventory items to a chat message - pure communication, this
 * never touches Inventory.quantity or transfers stock automatically.
 */
const ProductRequestModal = ({ onClose, onSend, sending }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const { data } = await getInventoryItems({ limit: 100 });
        setItems(data.data.inventory.filter((i) => i.medicineId));
      } catch {
        toast.error("We couldn't load your inventory. Please try again.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => item.medicineId?.name?.toLowerCase().includes(q));
  }, [items, search]);

  const handleSend = () => {
    if (!selected || quantity < 1) return;
    onSend({ inventoryId: selected._id, quantityRequested: quantity, note: note.trim() });
  };

  return (
    <Modal onClose={onClose} maxWidth="lg">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
        <h3 className="text-base font-bold text-ink flex items-center gap-2">
          <FiPackage className="text-brandPrimary" /> Request a Product
        </h3>
        <button onClick={onClose} className="text-ink-faint hover:text-ink p-1" aria-label="Close">
          <FiX size={18} />
        </button>
      </div>

      <div className="p-6 space-y-4">
        {!selected ? (
          <>
            <FormField
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search your medicines..."
              icon={FiSearch}
            />
            <div className="max-h-72 overflow-y-auto space-y-1.5">
              {loading ? (
                <SkeletonRows count={4} />
              ) : filtered.length === 0 ? (
                <p className="text-sm text-ink-faint text-center py-8">No matching medicines in your inventory.</p>
              ) : (
                filtered.map((item) => (
                  <button
                    key={item._id}
                    type="button"
                    onClick={() => setSelected(item)}
                    className="w-full text-left px-4 py-3 rounded-2xl border border-slate-200 hover:border-brandPrimary/40 hover:bg-primary-50 transition-colors"
                  >
                    <p className="text-sm font-semibold text-ink">{item.medicineId.name}</p>
                    <p className="text-xs text-ink-faint">{item.medicineId.manufacturer}</p>
                  </button>
                ))
              )}
            </div>
          </>
        ) : (
          <>
            <div className="flex items-start justify-between gap-3 p-4 rounded-2xl bg-primary-50 border border-brandPrimary/20">
              <div>
                <p className="text-sm font-bold text-ink">{selected.medicineId.name}</p>
                <p className="text-xs text-ink-faint">{selected.medicineId.manufacturer}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="text-xs font-semibold text-brandPrimary shrink-0"
              >
                Change
              </button>
            </div>
            <FormField
              label="Requested quantity"
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
            />
            <FormField
              label="Note (optional)"
              as="textarea"
              rows={3}
              maxLength={500}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Any context for this request..."
            />
          </>
        )}
      </div>

      <div className="flex justify-end gap-2 px-6 py-4 border-t border-slate-100">
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSend} disabled={!selected} loading={sending}>
          Send Request
        </Button>
      </div>
    </Modal>
  );
};

export default ProductRequestModal;
