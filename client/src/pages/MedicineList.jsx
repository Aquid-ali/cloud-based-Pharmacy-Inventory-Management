import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiSearch, FiEdit2, FiTrash2, FiEye, FiPlus, FiFilter, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { getMedicines, deleteMedicine } from '../services/medicineService';
import Spinner from '../components/Spinner';
import EmptyState from '../components/EmptyState';
import ConfirmModal from '../components/ConfirmModal';

const statusBadge = {
  'In Stock': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Low Stock': 'bg-amber-50 text-amber-700 border-amber-200',
  'Out of Stock': 'bg-slate-100 text-slate-700 border-slate-200',
  Expired: 'bg-rose-50 text-rose-700 border-rose-200',
};

const MedicineList = () => {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [expiry, setExpiry] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [order, setOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ totalPages: 1, total: 0 });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchMedicines = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getMedicines({
        search: search || undefined,
        category: category || undefined,
        expiry: expiry || undefined,
        sortBy,
        order,
        page,
        limit: 10,
      });
      setMedicines(data.data.medicines);
      setPagination(data.data.pagination);
    } catch (error) {
      toast.error('Failed to load medicines');
    } finally {
      setLoading(false);
    }
  }, [search, category, expiry, sortBy, order, page]);

  useEffect(() => {
    fetchMedicines();
  }, [fetchMedicines]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteMedicine(deleteTarget._id);
      toast.success('Medicine deleted');
      setDeleteTarget(null);
      fetchMedicines();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete medicine');
    } finally {
      setDeleting(false);
    }
  };

  const toggleSort = (field) => {
    if (sortBy === field) {
      setOrder(order === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setOrder('asc');
    }
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-serif text-slate-900 mb-1">
            Medicine Inventory
          </h1>
          <p className="text-xs text-slate-500">
            Total {pagination.total} registered products in stock.
          </p>
        </div>
        <Link
          to="/medicines/add"
          className="flex items-center justify-center gap-2 bg-[#346560] hover:bg-[#2b5450] text-white text-sm font-medium px-5 py-3 rounded-2xl shadow-lg shadow-[#346560]/20 transition-all"
        >
          <FiPlus size={18} />
          <span>Add Medicine</span>
        </Link>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-4 flex flex-col lg:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search by name, generic name, or manufacturer..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-11 pr-4 py-2.5 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-[#346560] focus:ring-4 focus:ring-[#346560]/10 placeholder:text-slate-400"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {/* Category Filter */}
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
            className="px-3.5 py-2.5 border border-slate-200 rounded-2xl text-sm text-slate-700 bg-white focus:outline-none focus:border-[#346560] cursor-pointer"
          >
            <option value="">All Categories</option>
            <option value="Tablet">Tablet</option>
            <option value="Capsule font-sans">Capsule</option>
            <option value="Syrup">Syrup</option>
            <option value="Injection">Injection</option>
            <option value="Ointment">Ointment</option>
            <option value="Drops">Drops</option>
            <option value="Inhaler">Inhaler</option>
            <option value="Other">Other</option>
          </select>

          {/* Expiry Filter */}
          <select
            value={expiry}
            onChange={(e) => {
              setExpiry(e.target.value);
              setPage(1);
            }}
            className="px-3.5 py-2.5 border border-slate-200 rounded-2xl text-sm text-slate-700 bg-white focus:outline-none focus:border-[#346560] cursor-pointer"
          >
            <option value="">All Expiry Status</option>
            <option value="valid">Valid</option>
            <option value="expiringSoon">Expiring Soon (30d)</option>
            <option value="expired">Expired</option>
          </select>

          {/* Sort By */}
          <select
            value={`${sortBy}-${order}`}
            onChange={(e) => {
              const [f, o] = e.target.value.split('-');
              setSortBy(f);
              setOrder(o);
              setPage(1);
            }}
            className="px-3.5 py-2.5 border border-slate-200 rounded-2xl text-sm text-slate-700 bg-white focus:outline-none focus:border-[#346560] cursor-pointer"
          >
            <option value="createdAt-desc">Newest First</option>
            <option value="medicineName-asc">Name (A-Z)</option>
            <option value="medicineName-desc">Name (Z-A)</option>
            <option value="quantity-asc">Lowest Stock</option>
            <option value="expiryDate-asc">Earliest Expiry</option>
          </select>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16">
            <Spinner size="lg" />
          </div>
        ) : medicines.length === 0 ? (
          <EmptyState
            title="No medicines found"
            message="Try adjusting your search filters or add a new medicine."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-[#f7f9f8] text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200/80">
                <tr>
                  <th className="py-4 px-6">Medicine</th>
                  <th className="py-4 px-4">Category</th>
                  <th className="py-4 px-4">Batch</th>
                  <th className="py-4 px-4">Stock</th>
                  <th className="py-4 px-4">Price</th>
                  <th className="py-4 px-4">Expiry</th>
                  <th className="py-4 px-4">Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {medicines.map((item) => (
                  <tr key={item._id} className="hover:bg-[#f0f7f6]/50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-semibold text-slate-900">{item.medicineName}</div>
                      <div className="text-xs text-slate-400">
                        {item.genericName || item.manufacturer}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="px-2.5 py-1 rounded-xl text-xs font-medium bg-slate-100 text-slate-600">
                        {item.category}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-xs font-mono text-slate-500">
                      {item.batchNumber}
                    </td>
                    <td className="py-4 px-4 font-semibold text-slate-800">
                      {item.quantity}
                    </td>
                    <td className="py-4 px-4 font-medium text-slate-800">
                      ${item.sellingPrice?.toFixed(2)}
                    </td>
                    <td className="py-4 px-4 text-xs text-slate-600">
                      {new Date(item.expiryDate).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${
                          statusBadge[item.status] || 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/medicines/${item._id}`}
                          className="p-2 text-slate-400 hover:text-[#346560] hover:bg-[#346560]/10 rounded-xl transition-colors"
                          title="View details"
                        >
                          <FiEye size={16} />
                        </Link>
                        <Link
                          to={`/medicines/edit/${item._id}`}
                          className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-colors"
                          title="Edit"
                        >
                          <FiEdit2 size={16} />
                        </Link>
                        <button
                          onClick={() => setDeleteTarget(item)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                          title="Delete"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {!loading && medicines.length > 0 && (
          <div className="py-4 px-6 bg-[#f7f9f8] border-t border-slate-200/80 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Page {page} of {pagination.totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors"
              >
                <FiChevronLeft size={16} />
              </button>
              <button
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors"
              >
                <FiChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <ConfirmModal
          title="Delete Medicine"
          message={`Are you sure you want to delete "${deleteTarget.medicineName}"? This action cannot be undone.`}
          confirmText="Delete"
          loading={deleting}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
};

export default MedicineList;
