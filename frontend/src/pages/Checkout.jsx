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
  const [customer, setCustomer] = useState({ name: '', phone: '', address: '' });

  function updateField(k, v) {
    setCustomer((s) => ({ ...s, [k]: v }));
  }

  async function placeOrder() {
    if (!customer.name || !customer.phone || !customer.address) {
      setMessage('Please fill name, phone and address');
      return;
    }

    setLoading(true);
    setMessage('');
    try {
      const res = await axios.post('http://localhost:5000/api/checkout', { cart, total, customer, paymentMethod: 'COD' });
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
                <div className="mt-5 grid gap-4">
                  <input value={customer.name} onChange={(e) => updateField('name', e.target.value)} placeholder="Full name" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition placeholder:text-slate-400 focus:border-brand-ink focus:bg-white" />
                  <input value={customer.phone} onChange={(e) => updateField('phone', e.target.value)} placeholder="Phone" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition placeholder:text-slate-400 focus:border-brand-ink focus:bg-white" />
                  <textarea value={customer.address} onChange={(e) => updateField('address', e.target.value)} placeholder="Address" className="min-h-28 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition placeholder:text-slate-400 focus:border-brand-ink focus:bg-white" />
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

              <div className="space-y-3 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                <div className="flex items-center justify-between">
                  <span>Items</span>
                  <span className="font-semibold text-brand-ink">{cart.reduce((sum, item) => sum + (item.qty || 0), 0)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-brand-ink">{formatPrice(total)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Delivery</span>
                  <span className="font-semibold text-brand-ink">COD shipping</span>
                </div>
              </div>

              <div className="rounded-2xl border border-dashed border-slate-300 p-4 text-sm leading-6 text-slate-600">
                Double-check size and quantity before placing the order.
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
