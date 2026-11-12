import { useEffect, useState } from 'react';
import { API_BASE_URL } from '../../config/api';

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState('percentage');
  const [discountValue, setDiscountValue] = useState(10);
  const [minimumCartValue, setMinimumCartValue] = useState(999);
  const [maxDiscountLimit, setMaxDiscountLimit] = useState(300);
  const [perUserLimit, setPerUserLimit] = useState(1);
  const [activeFrom, setActiveFrom] = useState('');
  const [activeTo, setActiveTo] = useState('');
  const [isActive, setIsActive] = useState(true);

  const token = localStorage.getItem('adminToken');

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/coupons`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setCoupons(data.coupons || []);
      } else {
        setError(data.message || 'Failed to fetch coupon matrix.');
      }
    } catch {
      setError('Cannot connect to coupon engine service.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (coupon) => {
    setEditingCoupon(coupon);
    setCode(coupon.code);
    setDiscountType(coupon.discountType);
    setDiscountValue(coupon.discountValue);
    setMinimumCartValue(coupon.minimumCartValue || 0);
    setMaxDiscountLimit(coupon.maxDiscountLimit || 0);
    setPerUserLimit(coupon.perUserLimit || 1);
    const fromDate = coupon.activeFrom ? new Date(coupon.activeFrom).toISOString().split('T')[0] : '';
    const toDate = coupon.activeTo ? new Date(coupon.activeTo).toISOString().split('T')[0] : '';
    setActiveFrom(fromDate);
    setActiveTo(toDate);
    setIsActive(coupon.isActive);
    setShowAddForm(false);
  };

  const handleCreateClick = () => {
    setEditingCoupon(null);
    setCode('');
    setDiscountType('percentage');
    setDiscountValue(10);
    setMinimumCartValue(999);
    setMaxDiscountLimit(300);
    setPerUserLimit(1);
    const today = new Date();
    const nextMonth = new Date();
    nextMonth.setMonth(today.getMonth() + 1);
    setActiveFrom(today.toISOString().split('T')[0]);
    setActiveTo(nextMonth.toISOString().split('T')[0]);
    setIsActive(true);
    setShowAddForm(true);
  };

  const handleSaveCoupon = async (e) => {
    e.preventDefault();
    const cleanCode = code.trim().toUpperCase();
    if (!/^[A-Z0-9_-]{3,20}$/.test(cleanCode)) {
      alert('Coupon code must be 3-20 characters long (letters, numbers, underscores, hyphens only).');
      return;
    }
    const numDiscount = Number(discountValue);
    const numMinCart = Number(minimumCartValue);
    if (numDiscount <= 0) {
      alert('Discount value must be greater than 0.');
      return;
    }
    if (discountType === 'percentage' && numDiscount > 90) {
      alert('Percentage discount cannot exceed 90%.');
      return;
    }
    if (discountType === 'flat' && numMinCart <= numDiscount) {
      alert(`Invalid Coupon Logic: Minimum cart value (₹${numMinCart}) must be strictly greater than flat discount (₹${numDiscount}) so that orders never result in zero or negative cost.`);
      return;
    }
    if (activeFrom && activeTo && new Date(activeTo) <= new Date(activeFrom)) {
      alert('Expiry date must be strictly after the start date.');
      return;
    }

    const payload = {
      code: cleanCode,
      discountType,
      discountValue: numDiscount,
      minimumCartValue: numMinCart,
      maxDiscountLimit: maxDiscountLimit ? Number(maxDiscountLimit) : undefined,
      perUserLimit: Number(perUserLimit) || 1,
      activeFrom: new Date(activeFrom),
      activeTo: new Date(activeTo),
      isActive,
    };
    try {
      const url = editingCoupon
        ? `${API_BASE_URL}/api/admin/coupons/${editingCoupon._id}`
        : `${API_BASE_URL}/api/admin/coupons`;
      const method = editingCoupon ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setEditingCoupon(null);
        setShowAddForm(false);
        fetchCoupons();
      } else {
        alert(data.message || 'Error occurred while saving coupon code.');
      }
    } catch {
      alert('Error connecting to coupon api endpoint.');
    }
  };

  const handleToggleStatus = async (coupon) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/coupons/${coupon._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...coupon, isActive: !coupon.isActive }),
      });
      const data = await res.json();
      if (data.success) fetchCoupons();
      else alert(data.message || 'Status update failed.');
    } catch {
      alert('Network error updating coupon status.');
    }
  };

  const handleDeleteCoupon = async (id) => {
    if (!window.confirm('Delete this coupon code permanently? Checkout codes will instantly deactivate.')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/coupons/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        fetchCoupons();
      } else {
        alert(data.message || 'Delete failed.');
      }
    } catch {
      alert('Server error.');
    }
  };

  const getCouponStatus = (c) => {
    if (!c.isActive) return { label: 'Disabled', cls: 'bg-slate-100 text-slate-500 border-slate-200' };
    const now = new Date();
    if (c.activeTo && new Date(c.activeTo) < now) return { label: 'Expired', cls: 'bg-red-50 text-red-600 border-red-200' };
    return { label: 'Active', cls: 'bg-emerald-50 text-emerald-600 border-emerald-200' };
  };

  const isFlatMarginInvalid = discountType === 'flat' && Number(minimumCartValue) <= Number(discountValue);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">Coupon Capping Engine</h1>
          <p className="text-slate-500 text-sm mt-1">Configure promotional codes, percentage/flat caps, date windows, and per-user consumption limits.</p>
        </div>
        <button
          onClick={handleCreateClick}
          className="px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold hover:from-emerald-500 hover:to-teal-500 transition-all cursor-pointer shadow-lg shadow-emerald-500/20 flex items-center gap-2 self-start sm:self-auto"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Create Promo Code
        </button>
      </div>

      {(editingCoupon || showAddForm) && (
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <h3 className="text-xl font-bold text-slate-900 mb-6">{editingCoupon ? `Modify: ${code}` : 'Create New Coupon Code'}</h3>
          <form onSubmit={handleSaveCoupon} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Promo Code</label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="mt-1 block w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 text-sm focus:border-indigo-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 uppercase font-mono"
                  placeholder="THREADLAB20"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Discount Type</label>
                <select
                  value={discountType}
                  onChange={(e) => setDiscountType(e.target.value)}
                  className="mt-1 block w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 text-sm focus:border-indigo-500 focus:outline-hidden"
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="flat">Flat Amount (₹)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Discount Value</label>
                <input
                  type="number"
                  min="1"
                  max={discountType === 'percentage' ? '90' : undefined}
                  required
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  className="mt-1 block w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 text-sm focus:border-indigo-500 focus:outline-hidden"
                />
                {discountType === 'percentage' && Number(discountValue) > 90 && (
                  <p className="text-xs text-red-500 mt-1 font-semibold">Maximum allowed percentage is 90%.</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Minimum Cart Value (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={minimumCartValue}
                  onChange={(e) => setMinimumCartValue(e.target.value)}
                  className={`mt-1 block w-full rounded-xl border px-4 py-2.5 text-slate-900 text-sm focus:outline-hidden ${
                    isFlatMarginInvalid ? 'border-red-400 bg-red-50/50' : 'border-slate-300 bg-white focus:border-indigo-500'
                  }`}
                />
                {isFlatMarginInvalid ? (
                  <p className="text-xs text-red-500 mt-1 font-semibold">
                    Must be &gt; ₹{discountValue} to prevent zero/negative cart orders!
                  </p>
                ) : discountType === 'flat' ? (
                  <p className="text-xs text-slate-400 mt-1">Customers save ₹{discountValue} on carts ≥ ₹{minimumCartValue}</p>
                ) : null}
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Max Discount Cap (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={maxDiscountLimit}
                  onChange={(e) => setMaxDiscountLimit(e.target.value)}
                  className="mt-1 block w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 text-sm focus:border-indigo-500 focus:outline-hidden"
                />
                <p className="text-xs text-slate-400 mt-1">Optional maximum discount ceiling</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Per User Limit</label>
                <input
                  type="number"
                  min="1"
                  value={perUserLimit}
                  onChange={(e) => setPerUserLimit(e.target.value)}
                  className="mt-1 block w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 text-sm focus:border-indigo-500 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Active From</label>
                <input
                  type="date"
                  value={activeFrom}
                  onChange={(e) => setActiveFrom(e.target.value)}
                  className="mt-1 block w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 text-sm focus:border-indigo-500 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Active To (Expiry)</label>
                <input
                  type="date"
                  value={activeTo}
                  onChange={(e) => setActiveTo(e.target.value)}
                  className="mt-1 block w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 text-sm focus:border-indigo-500 focus:outline-hidden"
                />
              </div>
              <div className="flex items-end pb-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-5 h-5 rounded accent-indigo-600"
                  />
                  <span className="text-sm font-semibold text-slate-700">Code Enabled</span>
                </label>
              </div>
            </div>
            <div className="flex gap-4 justify-end border-t border-slate-200 pt-6">
              <button
                type="button"
                onClick={() => {
                  setEditingCoupon(null);
                  setShowAddForm(false);
                }}
                className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer text-sm font-semibold"
              >
                Discard
              </button>
              <button
                type="submit"
                disabled={isFlatMarginInvalid}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-500 transition-colors cursor-pointer text-sm shadow-md shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save Coupon Code
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="animate-pulse space-y-4">
          <div className="h-12 bg-slate-200 rounded-xl"></div>
          <div className="h-12 bg-slate-200 rounded-xl"></div>
        </div>
      ) : coupons.length > 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider">
                  <th className="px-6 py-4">Promo Code</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Value</th>
                  <th className="px-6 py-4">Min Cart</th>
                  <th className="px-6 py-4">Max Cap</th>
                  <th className="px-6 py-4">Window</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Usage</th>
                  <th className="px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {coupons.map((c) => {
                  const status = getCouponStatus(c);
                  return (
                    <tr key={c._id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-900 font-mono text-sm">{c.code}</td>
                      <td className="px-6 py-4 capitalize">{c.discountType}</td>
                      <td className="px-6 py-4 font-bold text-emerald-600">
                        {c.discountType === 'percentage' ? `${c.discountValue}%` : `₹${c.discountValue}`}
                      </td>
                      <td className="px-6 py-4">₹{c.minimumCartValue || 0}</td>
                      <td className="px-6 py-4">{c.maxDiscountLimit ? `₹${c.maxDiscountLimit}` : '—'}</td>
                      <td className="px-6 py-4 text-slate-400">
                        {c.activeFrom ? new Date(c.activeFrom).toLocaleDateString() : '—'} →{' '}
                        {c.activeTo ? new Date(c.activeTo).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleToggleStatus(c)}
                          className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border transition cursor-pointer hover:opacity-80 ${status.cls}`}
                          title="Click to toggle active status"
                        >
                          {status.label}
                        </button>
                      </td>
                      <td className="px-6 py-4 font-mono font-semibold">{c.usageCount || 0}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleEditClick(c)}
                          className="text-indigo-600 hover:text-indigo-500 font-semibold mr-3 cursor-pointer"
                        >
                          Modify
                        </button>
                        <button
                          onClick={() => handleDeleteCoupon(c._id)}
                          className="text-red-500 hover:text-red-400 font-semibold cursor-pointer"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="border border-slate-200 bg-white rounded-3xl py-16 text-center text-slate-500 text-sm shadow-sm">
          No coupon codes configured yet. Create your first promotional code above.
        </div>
      )}
    </div>
  );
}
