import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config/api';
import axios from 'axios';

function formatPrice(v) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v);
}

export default function Checkout() {
  const { cart, total, clear, addItem, updateItemQty, removeItem } = useCart();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [orderPlacedDetails, setOrderPlacedDetails] = useState(null);
  const [coupons, setCoupons] = useState([]);
  const [fieldErrors, setFieldErrors] = useState({});
  const [coupon, setCoupon] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState('');
  const [couponMessage, setCouponMessage] = useState({ text: '', type: '' });

  // User-isolated address storage key to prevent any cross-user data leakage
  const getAddressStorageKey = (currentUser) => {
    if (currentUser?._id) return `user_addresses_${currentUser._id}`;
    if (currentUser?.email) return `user_addresses_${currentUser.email.toLowerCase().trim()}`;
    return 'guest_checkout_addresses';
  };

  // Address modal and saved addresses state
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState('');
  const [modalAddress, setModalAddress] = useState({ name: '', phone: '', address: '', postcode: '' });

  // Strictly sync and isolate addresses per authenticated user session
  useEffect(() => {
    // Purge legacy global key if it exists to prevent cross-contamination
    try {
      localStorage.removeItem('savedAddresses');
    } catch (e) {}

    const storageKey = getAddressStorageKey(user);
    let loaded = [];

    // 1. If user has addresses saved in MongoDB profile, load them
    if (user && Array.isArray(user.addresses) && user.addresses.length > 0) {
      loaded = user.addresses.map((a, idx) => ({
        id: a._id ? String(a._id) : `addr_db_${idx}`,
        name: a.fullName || user.name || '',
        phone: a.phone || user.phone || '',
        address: [a.line1, a.line2, a.city, a.state].filter(Boolean).join(', '),
        postcode: a.postalCode || '',
        isDefault: Boolean(a.isDefault),
      }));
    }

    // 2. Also check scoped local storage for this specific user or guest
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const localList = JSON.parse(raw);
        if (Array.isArray(localList)) {
          localList.forEach((la) => {
            if (!loaded.some((item) => item.address === la.address && item.postcode === la.postcode && item.name === la.name)) {
              loaded.push(la);
            }
          });
        }
      }
    } catch (e) {}

    // 3. Fallback: if user is logged in but has no saved addresses yet, prefill template if user has name/phone
    if (loaded.length === 0 && user && (user.name || user.phone)) {
      const defaultAddr = user.addresses?.[0];
      const initialAddr = {
        id: `addr_profile_${Date.now()}`,
        name: user.name || '',
        phone: user.phone || defaultAddr?.phone || '',
        address: defaultAddr ? [defaultAddr.line1, defaultAddr.city, defaultAddr.state].filter(Boolean).join(', ') : '',
        postcode: defaultAddr?.postalCode || '',
      };
      if (initialAddr.address && initialAddr.phone) {
        loaded.push(initialAddr);
      }
    }

    setSavedAddresses(loaded);
    const def = loaded.find((a) => a.isDefault) || loaded[0];
    setSelectedAddressId(def ? def.id : '');
  }, [user]);

  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/coupons`);
        const data = await res.json();
        if (data.success && Array.isArray(data.coupons)) {
          setCoupons(data.coupons);
        }
      } catch (err) {
        console.error('Failed to fetch coupons');
      }
    };
    fetchCoupons();
  }, []);

  let discount = 0;
  if (appliedCoupon) {
    const foundCoupon = coupons?.find(c => c.code === appliedCoupon && c.isActive);
    if (foundCoupon) {
      if (foundCoupon.discountType === 'percentage') {
        discount = Math.round((total * foundCoupon.discountValue) / 100);
        if (foundCoupon.maxDiscountLimit) {
          discount = Math.min(discount, foundCoupon.maxDiscountLimit);
        }
      } else if (foundCoupon.discountType === 'flat') {
        discount = foundCoupon.discountValue;
      }
    }
  }
  const finalTotal = Math.max(total - discount, 0);

  function normalizeText(value) {
    return value.replace(/[`<>]/g, '').replace(/\s+/g, ' ').trimStart();
  }

  function sanitizePhone(value) {
    return value.replace(/\D/g, '').slice(0, 10);
  }

  function sanitizePostcode(value) {
    return value.replace(/\D/g, '').slice(0, 6);
  }

  function getValidationErrors(data) {
    const name = (data.name || '').trim();
    const phone = (data.phone || '').trim();
    const address = (data.address || '').trim();
    const postcode = (data.postcode || '').trim();

    return {
      name: /^[a-zA-Z][a-zA-Z\s'.-]{1,49}$/.test(name) ? '' : 'Please enter a valid full name',
      phone: /^[6-9]\d{9}$/.test(phone) ? '' : 'Please enter a valid 10-digit mobile number',
      address: /^[a-zA-Z0-9][a-zA-Z0-9\s,.-/#]{5,119}$/.test(address) ? '' : 'Please enter a valid delivery address (min 6 chars)',
      postcode: /^\d{6}$/.test(postcode) ? '' : 'Please enter a valid 6-digit postal code',
    };
  }

  const handleOpenAddModal = () => {
    setEditingAddressId('');
    setModalAddress({
      name: user?.name || '',
      phone: user?.phone || '',
      address: '',
      postcode: '',
    });
    setFieldErrors({});
    setIsAddressModalOpen(true);
  };

  const handleOpenEditModal = (addr, e) => {
    if (e) e.stopPropagation();
    setEditingAddressId(addr.id);
    setModalAddress({
      name: addr.name,
      phone: addr.phone,
      address: addr.address,
      postcode: addr.postcode,
    });
    setFieldErrors({});
    setIsAddressModalOpen(true);
  };

  const handleModalFieldChange = (key, val) => {
    const sanitized = key === 'phone' ? sanitizePhone(val) : key === 'postcode' ? sanitizePostcode(val) : normalizeText(val);
    setModalAddress(prev => ({ ...prev, [key]: sanitized }));
    setFieldErrors(prev => ({ ...prev, [key]: '' }));
  };

  const handleSaveModalAddress = (e) => {
    e.preventDefault();
    const errors = getValidationErrors(modalAddress);
    if (Object.values(errors).some(Boolean)) {
      setFieldErrors(errors);
      return;
    }

    const cleanAddress = {
      id: editingAddressId || `addr_${Date.now()}`,
      name: modalAddress.name.trim(),
      phone: modalAddress.phone.trim(),
      address: modalAddress.address.trim(),
      postcode: modalAddress.postcode.trim(),
    };

    setSavedAddresses((prev) => {
      const existing = prev.some((item) => item.id === cleanAddress.id);
      const next = existing
        ? prev.map((item) => (item.id === cleanAddress.id ? cleanAddress : item))
        : [cleanAddress, ...prev];
      try {
        localStorage.setItem(getAddressStorageKey(user), JSON.stringify(next));
      } catch (err) {}
      return next;
    });

    setSelectedAddressId(cleanAddress.id);
    setIsAddressModalOpen(false);
    setEditingAddressId('');
    setMessage('');
  };

  const handleDeleteAddress = (id, e) => {
    if (e) e.stopPropagation();
    setSavedAddresses((prev) => {
      const next = prev.filter((item) => item.id !== id);
      try {
        localStorage.setItem(getAddressStorageKey(user), JSON.stringify(next));
      } catch (err) {}
      if (selectedAddressId === id) {
        setSelectedAddressId(next[0]?.id || '');
      }
      return next;
    });
  };

  function applyCoupon() {
    const normalized = coupon.trim().toUpperCase();
    const foundCoupon = coupons?.find(c => c.code === normalized && c.isActive);
    
    if (!foundCoupon) {
      setAppliedCoupon('');
      setCouponMessage({ text: 'Invalid or expired coupon code', type: 'error' });
      return;
    }

    const now = new Date();
    if (foundCoupon.activeTo && new Date(foundCoupon.activeTo) < now) {
      setAppliedCoupon('');
      setCouponMessage({ text: 'Coupon has expired', type: 'error' });
      return;
    }

    if (foundCoupon.minimumCartValue && total < foundCoupon.minimumCartValue) {
      setAppliedCoupon('');
      setCouponMessage({ text: `Minimum cart value must be ₹${foundCoupon.minimumCartValue}`, type: 'error' });
      return;
    }

    setAppliedCoupon(normalized);
    setCouponMessage({ text: 'Coupon code successfully applied', type: 'success' });
  }

  async function placeOrder() {
    const activeAddress = savedAddresses.find((item) => item.id === selectedAddressId) || savedAddresses[0];

    if (!activeAddress) {
      handleOpenAddModal();
      setMessage('Please add a delivery address to complete your order.');
      return;
    }

    const errors = getValidationErrors(activeAddress);
    if (Object.values(errors).some(Boolean)) {
      setEditingAddressId(activeAddress.id);
      setModalAddress({ ...activeAddress });
      setFieldErrors(errors);
      setIsAddressModalOpen(true);
      return;
    }

    setFieldErrors({});
    setLoading(true);
    setMessage('');
    try {
      const token = localStorage.getItem('authToken');
      const res = await axios.post(
        `${API_BASE_URL}/api/checkout`,
        {
          cart,
          total: finalTotal,
          customer: {
            name: activeAddress.name,
            phone: activeAddress.phone,
            address: `${activeAddress.address}, ${activeAddress.postcode}`,
            email: user?.email || '',
          },
          paymentMethod: 'COD',
          couponCode: appliedCoupon,
        },
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );
      if (res.data?.success) {
        setOrderPlacedDetails({
          orderId: res.data.orderId,
          amount: res.data.amount,
          status: res.data.status,
        });
        clear();
      } else {
        setMessage(res.data?.message || 'Order failed');
      }
    } catch (e) {
      setMessage(e.response?.data?.message || 'Network error or server offline');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="bg-[radial-gradient(circle_at_top,_rgba(108,99,255,0.12),_transparent_30%),linear-gradient(180deg,_#fff,_#f8fafc_58%,_#fff)]">
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8">
          <span className="inline-flex rounded-full bg-brand-gold/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-brand-ink">Checkout</span>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-brand-ink">Confirm your COD order.</h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">Select or add your delivery address and place a cash-on-delivery order in seconds.</p>
        </div>

        {orderPlacedDetails ? (
          <div className="rounded-[2.5rem] border border-slate-200 bg-white p-10 text-center shadow-[0_20px_50px_rgba(15,23,42,0.08)] max-w-xl mx-auto">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="inline-flex rounded-full bg-emerald-50 text-emerald-700 px-3 py-1 text-xs font-bold uppercase tracking-wider border border-emerald-200 mb-3">
              Order Confirmed (Cash on Delivery)
            </span>
            <h2 className="text-3xl font-black text-brand-ink">Thank you for your order!</h2>
            <p className="mt-2 text-slate-600 text-sm">
              Your order has been recorded in the system and is queued for fulfillment.
            </p>
            <div className="mt-6 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-2 text-sm font-medium">
              <div className="flex justify-between text-slate-600">
                <span>Order ID:</span>
                <span className="font-mono font-bold text-brand-ink">{orderPlacedDetails.orderId}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Total Payable:</span>
                <span className="font-bold text-emerald-600 font-mono">₹{orderPlacedDetails.amount}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Payment Mode:</span>
                <span className="font-semibold text-slate-800">Cash On Delivery</span>
              </div>
            </div>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              {user ? (
                <Link to="/profile?tab=orders" className="inline-flex justify-center items-center rounded-full bg-black px-6 py-3 text-sm font-semibold text-white hover:opacity-90 transition">
                  Track in My Orders
                </Link>
              ) : null}
              <Link to="/shop" className="inline-flex justify-center items-center rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition">
                Continue Shopping
              </Link>
            </div>
          </div>
        ) : cart.length === 0 ? (
          <div className="rounded-[2rem] border border-slate-200 bg-white p-8 text-center shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
            <h2 className="text-2xl font-black text-brand-ink">Your cart is empty</h2>
            <p className="mt-2 text-slate-600">Add a product first, then come back here to complete the COD order.</p>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
            <div className="space-y-6">
              {/* Delivery Details Card with Compact Address Cards & Modal Trigger */}
              <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-100">
                  <div>
                    <h2 className="text-xl font-black text-brand-ink">Delivery details</h2>
                    <p className="mt-1 text-xs text-slate-500">Select where you'd like your order delivered.</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleOpenAddModal}
                    className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-full bg-black px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 transition cursor-pointer shadow-xs"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                    Add New Address
                  </button>
                </div>

                {savedAddresses.length > 0 ? (
                  <div className="mt-5">
                    <div className="grid gap-3 sm:grid-cols-2">
                      {savedAddresses.map((addr) => {
                        const isSelected = selectedAddressId === addr.id;
                        return (
                          <div
                            key={addr.id}
                            onClick={() => setSelectedAddressId(addr.id)}
                            className={`relative flex flex-col justify-between p-4 rounded-2xl border transition-all cursor-pointer text-left ${
                              isSelected
                                ? 'border-brand-ink bg-slate-50/80 ring-2 ring-brand-ink/10 shadow-xs'
                                : 'border-slate-200 bg-white hover:border-slate-300'
                            }`}
                          >
                            <div>
                              <div className="flex items-center justify-between gap-2 mb-2">
                                <span className="font-bold text-xs text-brand-ink truncate">{addr.name}</span>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  {isSelected && (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-brand-ink px-2 py-0.5 text-[9px] font-black uppercase text-white tracking-wider">
                                      ✓ Selected
                                    </span>
                                  )}
                                  <button
                                    type="button"
                                    onClick={(e) => handleOpenEditModal(addr, e)}
                                    className="text-slate-400 hover:text-brand-ink p-1 rounded-md transition cursor-pointer"
                                    title="Edit address"
                                  >
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                    </svg>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => handleDeleteAddress(addr.id, e)}
                                    className="text-slate-400 hover:text-red-500 p-1 rounded-md transition cursor-pointer"
                                    title="Delete address"
                                  >
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                              <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                                {addr.address}
                              </p>
                            </div>
                            <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                              <span>📞 {addr.phone}</span>
                              <span className="font-mono font-semibold bg-white border border-slate-200 px-1.5 py-0.5 rounded text-[10px]">
                                PIN: {addr.postcode}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="mt-5 rounded-2xl border-2 border-dashed border-slate-200 p-6 text-center">
                    <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <p className="text-xs font-bold text-slate-700">No delivery addresses found</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Click below to add your delivery address</p>
                    <button
                      type="button"
                      onClick={handleOpenAddModal}
                      className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-black text-white text-xs font-bold hover:bg-slate-800 transition cursor-pointer"
                    >
                      + Add Delivery Address
                    </button>
                  </div>
                )}
              </div>

              {/* Order Items Summary */}
              <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
                <h2 className="text-xl font-black text-brand-ink">Order items ({cart.reduce((s, p) => s + (p.qty || 1), 0)})</h2>
                <div className="mt-4 space-y-4">
                  {cart.map((p) => (
                    <div key={`${p.id}-${p.size || 'no'}`} className="flex flex-col gap-4 rounded-2xl bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3">
                        {p.img && (
                          <img src={p.img} alt={p.title} className="w-14 h-14 object-cover rounded-xl bg-white border border-slate-200 shrink-0" />
                        )}
                        <div>
                          <div className="font-semibold text-brand-ink text-sm">{p.title}</div>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                            {p.size && <span className="rounded-full bg-black px-2.5 py-0.5 text-[10px] font-semibold text-white">Size {p.size}</span>}
                            <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-medium text-slate-500 border border-slate-200">{formatPrice(p.price)} each</span>
                          </div>
                          <div className="mt-2.5 flex items-center gap-2">
                            <button onClick={() => {
                              const newQty = p.qty - 1;
                              if (newQty <= 0) removeItem(p.id, p.size);
                              else updateItemQty(p.id, p.size, newQty);
                            }} className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-sm font-bold text-brand-ink shadow-xs border border-slate-200 cursor-pointer">-</button>
                            <div className="min-w-6 text-center text-xs font-bold text-slate-700">{p.qty}</div>
                            <button onClick={() => addItem({ id: p.id, title: p.title, price: p.price, size: p.size, img: p.img })} className="flex h-8 w-8 items-center justify-center rounded-full bg-black text-sm font-bold text-white shadow-xs cursor-pointer">+</button>
                          </div>
                        </div>
                      </div>
                      <div className="text-right text-lg font-black text-brand-ink">{formatPrice(p.price * p.qty)}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar with Coupon & Pricing */}
            <aside className="sticky top-24 space-y-5 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Payment method</div>
                <h2 className="mt-2 text-2xl font-black text-brand-ink">Cash on delivery</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">No online payment setup is required. Pay when the order arrives.</p>
              </div>

              <div className="rounded-2xl border border-slate-200 p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Coupon code</div>
                <div className="mt-3 flex gap-2">
                  <input
                    value={coupon}
                    onChange={(e) => {
                      setCoupon(e.target.value);
                      setCouponMessage({ text: '', type: '' });
                    }}
                    placeholder="Enter code"
                    className="w-full rounded-full border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs outline-none focus:border-brand-ink focus:bg-white"
                  />
                  <button onClick={applyCoupon} className="shrink-0 rounded-full bg-black px-4 py-2.5 text-xs font-semibold text-white cursor-pointer hover:bg-slate-800 transition">
                    Apply
                  </button>
                </div>
                {couponMessage.text && (
                  <p className={`mt-2 text-xs font-semibold ${couponMessage.type === 'success' ? 'text-green-600' : 'text-red-500'}`}>
                    {couponMessage.text}
                  </p>
                )}
                <p className="mt-2 text-[11px] text-slate-500">Try <span className="font-semibold text-brand-ink">OFFER50</span> for 50% discount.</p>
              </div>

              <div className="space-y-3 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                <div className="flex items-center justify-between">
                  <span>Items</span>
                  <span className="font-semibold text-brand-ink">{cart.reduce((sum, item) => sum + (item.qty || 0), 0)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-brand-ink">{formatPrice(total)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex items-center justify-between">
                    <span>Discount</span>
                    <span className="font-semibold text-rose-500">-{formatPrice(discount)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between border-t border-slate-200 pt-3 text-base">
                  <span className="font-semibold text-brand-ink">Total</span>
                  <span className="font-black text-brand-ink">{formatPrice(finalTotal)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Delivery</span>
                  <span className="font-semibold text-brand-ink">COD shipping</span>
                </div>
              </div>

              <div className="rounded-2xl border border-dashed border-slate-300 p-4 text-xs leading-5 text-slate-500">
                Double-check selected address, size, and quantities before finalizing your cash on delivery order.
              </div>

              <button onClick={placeOrder} disabled={loading} className="inline-flex w-full items-center justify-center rounded-full bg-black px-5 py-4 text-sm font-semibold text-white shadow-lg shadow-black/10 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer">
                {loading ? 'Placing order...' : 'Place COD order'}
              </button>

              {message && <div className="rounded-2xl bg-red-50 border border-red-200 px-4 py-3 text-xs text-red-600 font-semibold">{message}</div>}
            </aside>
          </div>
        )}
      </section>

      {/* Address Add / Modify Modal Popup */}
      {isAddressModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-black text-brand-ink">
                  {editingAddressId ? 'Edit Delivery Address' : 'Add New Delivery Address'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Please provide accurate shipping details</p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddressModalOpen(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSaveModalAddress} className="mt-5 space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={modalAddress.name}
                  onChange={(e) => handleModalFieldChange('name', e.target.value)}
                  placeholder="e.g. John Doe"
                  className={`w-full rounded-xl border px-3.5 py-2.5 text-xs text-slate-800 outline-none transition ${fieldErrors.name ? 'border-red-500 focus:border-red-500 bg-red-50/20' : 'border-slate-300 focus:border-brand-ink'}`}
                />
                {fieldErrors.name && <p className="mt-1 text-[11px] font-semibold text-red-500">{fieldErrors.name}</p>}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">10-Digit Mobile Number</label>
                <input
                  type="tel"
                  required
                  value={modalAddress.phone}
                  onChange={(e) => handleModalFieldChange('phone', e.target.value)}
                  placeholder="e.g. 9876543210"
                  className={`w-full rounded-xl border px-3.5 py-2.5 text-xs text-slate-800 outline-none transition ${fieldErrors.phone ? 'border-red-500 focus:border-red-500 bg-red-50/20' : 'border-slate-300 focus:border-brand-ink'}`}
                />
                {fieldErrors.phone && <p className="mt-1 text-[11px] font-semibold text-red-500">{fieldErrors.phone}</p>}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Delivery Street Address</label>
                <textarea
                  rows="3"
                  required
                  value={modalAddress.address}
                  onChange={(e) => handleModalFieldChange('address', e.target.value)}
                  placeholder="House/Flat No., Apartment, Street, Landmark, City"
                  className={`w-full rounded-xl border px-3.5 py-2.5 text-xs text-slate-800 outline-none transition ${fieldErrors.address ? 'border-red-500 focus:border-red-500 bg-red-50/20' : 'border-slate-300 focus:border-brand-ink'}`}
                />
                {fieldErrors.address && <p className="mt-1 text-[11px] font-semibold text-red-500">{fieldErrors.address}</p>}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">6-Digit Pincode</label>
                <input
                  type="text"
                  required
                  maxLength="6"
                  inputMode="numeric"
                  value={modalAddress.postcode}
                  onChange={(e) => handleModalFieldChange('postcode', e.target.value)}
                  placeholder="e.g. 560001"
                  className={`w-full rounded-xl border px-3.5 py-2.5 text-xs text-slate-800 outline-none transition ${fieldErrors.postcode ? 'border-red-500 focus:border-red-500 bg-red-50/20' : 'border-slate-300 focus:border-brand-ink'}`}
                />
                {fieldErrors.postcode && <p className="mt-1 text-[11px] font-semibold text-red-500">{fieldErrors.postcode}</p>}
              </div>

              <div className="pt-3 border-t border-slate-100 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddressModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-50 text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-black text-white hover:bg-slate-800 text-xs font-bold transition cursor-pointer shadow-sm"
                >
                  {editingAddressId ? 'Update Address' : 'Save Address'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
