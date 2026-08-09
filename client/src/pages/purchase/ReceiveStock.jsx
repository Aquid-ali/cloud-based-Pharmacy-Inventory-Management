import React, { useState } from 'react';
import { FiDownload, FiCheck, FiPackage } from 'react-icons/fi';
import PageHeader from '../../components/PageHeader';
import { purchaseOrdersData, Badge } from '../../config/mockData';
import toast from 'react-hot-toast';

const pendingOrders = purchaseOrdersData.filter((p) => p.status !== 'Completed');

const ReceiveStock = () => {
  const [selected, setSelected] = useState(null);

  const handleReceive = () => {
    if (!selected) return;
    toast.success(`Stock received for ${selected.id}`);
    setSelected(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Receive Stock"
        description="Mark purchase orders as received and update inventory levels."
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-5">
          <h3 className="font-serif font-bold text-slate-800 mb-4">Pending Deliveries</h3>
          <div className="space-y-3">
            {pendingOrders.map((order) => (
              <button
                key={order.id}
                onClick={() => setSelected(order)}
                className={`w-full text-left p-4 rounded-2xl border transition-all ${
                  selected?.id === order.id
                    ? 'border-[#346560] bg-[#346560]/5'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-slate-800 text-sm">{order.id}</span>
                  <Badge status={order.status} />
                </div>
                <p className="text-xs text-slate-500">{order.supplier} · {order.items} items · {order.total}</p>
                <p className="text-xs text-slate-400 mt-1">Expected: {order.expected}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6">
          {selected ? (
            <>
              <h3 className="font-serif font-bold text-slate-800 mb-4">Receive {selected.id}</h3>
              <div className="space-y-4 mb-6">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><p className="text-slate-500 text-xs">Supplier</p><p className="font-semibold">{selected.supplier}</p></div>
                  <div><p className="text-slate-500 text-xs">Total Amount</p><p className="font-semibold">{selected.total}</p></div>
                  <div><p className="text-slate-500 text-xs">Items</p><p className="font-semibold">{selected.items}</p></div>
                  <div><p className="text-slate-500 text-xs">Expected Date</p><p className="font-semibold">{selected.expected}</p></div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Received Quantity Notes</label>
                  <textarea
                    rows={3}
                    placeholder="Optional notes about received stock..."
                    className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#346560]/20 focus:border-[#346560]"
                  />
                </div>
              </div>
              <button
                onClick={handleReceive}
                className="w-full inline-flex items-center justify-center gap-2 py-3 bg-[#346560] text-white rounded-2xl text-sm font-bold hover:bg-[#2a524e] transition-colors"
              >
                <FiCheck size={16} />
                Confirm Receipt
              </button>
            </>
          ) : (
            <div className="py-16 text-center text-slate-400">
              <FiPackage size={40} className="mx-auto mb-3 opacity-40" />
              <p className="text-sm">Select a purchase order to receive stock</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReceiveStock;
