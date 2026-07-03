import { useState } from 'react';
import { useCart } from '../context/CartContext';
import axios from 'axios';

function formatPrice(v) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v);
}

export default function Checkout() {
  const { cart, total, clear, addItem, updateItemQty, removeItem } = useCart();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [customer, setCustomer] = useState({ name: '', phone: '', address: '', postcode: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [coupon, setCoupon] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState('');
  const [couponMessage, setCouponMessage] = useState({ text: '', type: '' });
  const [savedAddresses, setSavedAddresses] = useState(() => {
    try {
      const raw = localStorage.getItem('savedAddresses');
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  });
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [editingAddressId, setEditingAddressId] = useState('');

  const discount = appliedCoupon === 'OFFER50' ? Math.round(total * 0.5) : 0;
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
    const name = data.name.trim();
    const phone = data.phone.trim();
    const address = data.address.trim();
    const postcode = data.postcode.trim();

    return {
      name: /^[a-zA-Z][a-zA-Z\s'.-]{1,49}$/.test(name) ? '' : 'Please enter a valid name',
      phone: /^[6-9]\d{9}$/.test(phone) ? '' : 'Please enter a valid 10-digit phone number',
      address: /^[a-zA-Z0-9][a-zA-Z0-9\s,.-/#]{5,119}$/.test(address) ? '' : 'Please enter a valid address',
      postcode: /^\d{6}$/.test(postcode) ? '' : 'Please enter a valid 6-digit postcode',
    };
  }

  function saveAddresses(nextCustomer = customer) {
    const errors = getValidationErrors(nextCustomer);
    if (Object.values(errors).some(Boolean)) {
      setFieldErrors(errors);
      setMessage('');
      return false;
    }

    const cleanAddress = {
      id: editingAddressId || `addr_${Date.now()}`,
      name: nextCustomer.name.trim(),
      phone: nextCustomer.phone.trim(),
      address: nextCustomer.address.trim(),
      postcode: nextCustomer.postcode.trim(),
    };

    setSavedAddresses((prev) => {
      const existing = prev.some((item) => item.id === cleanAddress.id);
      const next = existing ? prev.map((item) => (item.id === cleanAddress.id ? cleanAddress : item)) : [cleanAddress, ...prev];
      try {
        localStorage.setItem('savedAddresses', JSON.stringify(next));
      } catch (e) {}
      return next;
    });

    setSelectedAddressId(cleanAddress.id);
    setEditingAddressId(cleanAddress.id);
    setMessage(existingLabel(editingAddressId) ? 'Address updated' : 'Address saved');
    return true;
  }

  function existingLabel(id) {
    return savedAddresses.some((item) => item.id === id);
  }

  function selectAddress(address) {
    setEditingAddressId(address.id);
    setSelectedAddressId(address.id);
    setCustomer({ name: address.name, phone: address.phone, address: address.address, postcode: address.postcode });
    setFieldErrors({});
    setMessage('');
  }

  function startNewAddress() {
    setEditingAddressId('');
    setSelectedAddressId('');
    setCustomer({ name: '', phone: '', address: '', postcode: '' });
    setFieldErrors({});
    setMessage('');
  }

  function updateField(k, v) {
    const nextValue = k === 'phone' ? sanitizePhone(v) : k === 'postcode' ? sanitizePostcode(v) : normalizeText(v);
    setCustomer((s) => ({ ...s, [k]: nextValue }));
    setFieldErrors((errors) => ({ ...errors, [k]: '' }));
  }

  function applyCoupon() {
    const normalized = coupon.trim().toUpperCase();
    if (normalized === 'OFFER50') {
      setAppliedCoupon('OFFER50');
      setCouponMessage({ text: 'Coupon code successfully applied', type: 'success' });
      return;
    }

    setAppliedCoupon('');
    setCouponMessage({ text: 'Invalid or expired coupon code', type: 'error' });
  }

  async function placeOrder() {
    const errors = getValidationErrors(customer);

    if (Object.values(errors).some(Boolean)) {
      setFieldErrors(errors);
      setMessage('');
      return;
    }

    if (!savedAddresses.some((item) => item.id === selectedAddressId)) {
      const saved = saveAddresses(customer);
      if (!saved) return;
    }

    setFieldErrors({});
    setLoading(true);
    setMessage('');
    try {
      const selectedAddress = savedAddresses.find((item) => item.id === selectedAddressId) || {
        name: customer.name.trim(),
        phone: customer.phone.trim(),
        address: customer.address.trim(),
        postcode: customer.postcode.trim(),
      };
      const res = await axios.post('http://localhost:5000/api/checkout', {
        cart,
        total: finalTotal,
        customer: selectedAddress,
        paymentMethod: 'COD',
        couponCode: appliedCoupon,
      });
      if (res.data?.success) {
        setMessage(`Order placed — id: ${res.data.orderId} (COD)`);
        clear();
      } else {
        setMessage('Order failed');
      }
    } catch (e) {
      setMessage('Network error or server offline');
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
          <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">Fill in your delivery details and place a cash-on-delivery order in seconds.</p>
        </div>

        {cart.length === 0 ? (
          <div className="rounded-[2rem] border border-slate-200 bg-white p-8 text-center shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
            <h2 className="text-2xl font-black text-brand-ink">Your cart is empty</h2>
            <p className="mt-2 text-slate-600">Add a product first, then come back here to complete the COD order.</p>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
            <div className="space-y-6">
              <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
                <h2 className="text-xl font-black text-brand-ink">Delivery details</h2>
                <p className="mt-2 text-sm text-slate-500">We’ll use this information for your COD shipment.</p>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <button onClick={startNewAddress} className="rounded-full border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:border-brand-ink hover:text-brand-ink">
                    Add new address
                  </button>
                  <button onClick={() => saveAddresses()} className="rounded-full bg-black px-4 py-3 text-sm font-semibold text-white">
                    {editingAddressId ? 'Update address' : 'Save address'}
                  </button>
                </div>

                {savedAddresses.length > 0 && (
                  <div className="mt-5">
                    <div className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Saved addresses</div>
                    <div className="grid gap-3">
                      {savedAddresses.map((address) => (
                        <button
                          key={address.id}
                          onClick={() => selectAddress(address)}
                          className={`rounded-2xl border p-4 text-left transition ${selectedAddressId === address.id ? 'border-black bg-black text-white' : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-brand-ink'}`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="font-semibold">{address.name}</div>
                            <div className={`text-xs font-semibold ${selectedAddressId === address.id ? 'text-white/80' : 'text-slate-400'}`}>{address.postcode}</div>
                          </div>
                          <div className={`mt-1 text-sm leading-6 ${selectedAddressId === address.id ? 'text-white/85' : 'text-slate-600'}`}>
                            {address.address}
                          </div>
                          <div className={`mt-2 text-xs ${selectedAddressId === address.id ? 'text-white/75' : 'text-slate-500'}`}>{address.phone}</div>
                          <div className="mt-3 text-xs font-semibold uppercase tracking-[0.18em]">Click to edit</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-5 grid gap-4">
                  <div>
                    <input value={customer.name} onChange={(e) => updateField('name', e.target.value)} placeholder="Full name" className={`w-full rounded-2xl border bg-slate-50 px-4 py-3 outline-none transition placeholder:text-slate-400 focus:bg-white ${fieldErrors.name ? 'border-red-500 focus:border-red-500' : 'border-slate-200 focus:border-brand-ink'}`} />
                    {fieldErrors.name && <p className="mt-2 text-sm font-semibold text-red-500">{fieldErrors.name}</p>}
                  </div>
                  <div>
                    <input value={customer.phone} onChange={(e) => updateField('phone', e.target.value)} placeholder="Phone" className={`w-full rounded-2xl border bg-slate-50 px-4 py-3 outline-none transition placeholder:text-slate-400 focus:bg-white ${fieldErrors.phone ? 'border-red-500 focus:border-red-500' : 'border-slate-200 focus:border-brand-ink'}`} />
                    {fieldErrors.phone && <p className="mt-2 text-sm font-semibold text-red-500">{fieldErrors.phone}</p>}
                  </div>
                  <div>
                    <textarea value={customer.address} onChange={(e) => updateField('address', e.target.value)} placeholder="Address" className={`min-h-28 w-full rounded-2xl border bg-slate-50 px-4 py-3 outline-none transition placeholder:text-slate-400 focus:bg-white ${fieldErrors.address ? 'border-red-500 focus:border-red-500' : 'border-slate-200 focus:border-brand-ink'}`} />
                    {fieldErrors.address && <p className="mt-2 text-sm font-semibold text-red-500">{fieldErrors.address}</p>}
                  </div>
                  <div>
                    <input value={customer.postcode} onChange={(e) => updateField('postcode', e.target.value)} placeholder="Postcode / Pincode" inputMode="numeric" className={`w-full rounded-2xl border bg-slate-50 px-4 py-3 outline-none transition placeholder:text-slate-400 focus:bg-white ${fieldErrors.postcode ? 'border-red-500 focus:border-red-500' : 'border-slate-200 focus:border-brand-ink'}`} />
                    {fieldErrors.postcode && <p className="mt-2 text-sm font-semibold text-red-500">{fieldErrors.postcode}</p>}
                  </div>
                </div>
              </div>

              <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
                <h2 className="text-xl font-black text-brand-ink">Order items</h2>
                <div className="mt-4 space-y-4">
                  {cart.map((p) => (
                    <div key={`${p.id}-${p.size || 'no'}`} className="flex flex-col gap-4 rounded-2xl bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="font-semibold text-brand-ink">{p.title}</div>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-500">
                          {p.size && <span className="rounded-full bg-black px-3 py-1 text-xs font-semibold text-white">Size {p.size}</span>}
                          <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-500">{formatPrice(p.price)} each</span>
                        </div>
                        <div className="mt-3 flex items-center gap-2">
                          <button onClick={() => {
                            const newQty = p.qty - 1;
                            if (newQty <= 0) removeItem(p.id, p.size);
                            else updateItemQty(p.id, p.size, newQty);
                          }} className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-lg font-bold text-brand-ink shadow-sm">-</button>
                          <div className="min-w-8 text-center text-sm font-semibold text-slate-700">{p.qty}</div>
                          <button onClick={() => addItem({ id: p.id, title: p.title, price: p.price, size: p.size, img: p.img })} className="flex h-9 w-9 items-center justify-center rounded-full bg-black text-lg font-bold text-white shadow-sm">+</button>
                        </div>
                      </div>
                      <div className="text-right text-xl font-black text-brand-ink">{formatPrice(p.price * p.qty)}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

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
                    className="w-full rounded-full border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-brand-ink focus:bg-white"
                  />
                  <button onClick={applyCoupon} className="shrink-0 rounded-full bg-black px-4 py-3 text-sm font-semibold text-white">
                    Apply
                  </button>
                </div>
                {couponMessage.text && (
                  <p className={`mt-2 text-xs font-semibold ${couponMessage.type === 'success' ? 'text-green-600' : 'text-red-500'}`}>
                    {couponMessage.text}
                  </p>
                )}
                <p className="mt-2 text-xs text-slate-500">Use <span className="font-semibold text-brand-ink">OFFER50</span> for 50% off.</p>
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

              <div className="rounded-2xl border border-dashed border-slate-300 p-4 text-sm leading-6 text-slate-600">
                Double-check size, quantity, and address details before placing the order.
              </div>

              <button onClick={placeOrder} disabled={loading} className="inline-flex w-full items-center justify-center rounded-full bg-black px-5 py-4 text-sm font-semibold text-white shadow-lg shadow-black/10 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60">
                {loading ? 'Placing order...' : 'Place COD order'}
              </button>

              {message && <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700">{message}</div>}
            </aside>
          </div>
        )}
      </section>
    </main>
  );
}
