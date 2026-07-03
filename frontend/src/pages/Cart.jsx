import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

function formatPrice(v) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v);
}

export default function Cart() {
  const { cart, total, addItem, updateItemQty, removeItem, clear } = useCart();
  const { user } = useAuth();
  const itemCount = cart.reduce((sum, item) => sum + (item.qty || 0), 0);

  return (
    <main className="bg-brand-gradient">
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="inline-flex rounded-full bg-brand-gold/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-brand-ink">Shopping Cart</span>
            <h1 className="mt-4 text-4xl font-black tracking-tight text-brand-ink">Review your picks before COD checkout.</h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
              Manage sizes, update quantities, and confirm your order summary in one clean layout.
            </p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Items</div>
            <div className="text-3xl font-black text-brand-ink">{itemCount}</div>
          </div>
        </div>

        {cart.length === 0 ? (
          <div className="rounded-4xl border border-slate-200 bg-white p-8 text-center shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
            <h2 className="text-2xl font-black text-brand-ink">Your cart is empty</h2>
            <p className="mt-2 text-slate-600">Start with the latest drops and add something you like.</p>
            <Link to="/products" className="mt-6 inline-flex rounded-full bg-black px-5 py-3 text-sm font-semibold text-white">
              Browse products
            </Link>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[1.45fr_0.9fr] lg:items-start">
            <div className="space-y-4">
              {cart.map((p) => (
                <div key={`${p.id}-${p.size ?? 'no'}`} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
                  <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-4">
                      <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl bg-slate-100">
                        <img src={p.img || 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=600&q=80'} alt={p.title} className="h-full w-full object-contain bg-white p-2" />
                      </div>
                      <div>
                        <div className="text-lg font-bold text-brand-ink">{p.title}</div>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-500">
                          <span className="rounded-full bg-slate-100 px-3 py-1 font-medium">Price: {formatPrice(p.price)}</span>
                          {p.size && <span className="rounded-full bg-black px-3 py-1 font-medium text-white">Size {p.size}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-start gap-3 sm:items-end">
                      <div className="text-2xl font-black text-brand-ink">{formatPrice(p.price * p.qty)}</div>
                      <div className="flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2">
                        <button
                          onClick={() => {
                            const newQty = p.qty - 1;
                            if (newQty <= 0) removeItem(p.id, p.size);
                            else updateItemQty(p.id, p.size, newQty);
                          }}
                          className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-lg font-bold text-brand-ink"
                        >
                          -
                        </button>
                        <div className="min-w-8 text-center text-sm font-semibold text-slate-700">{p.qty}</div>
                        <button onClick={() => addItem({ id: p.id, title: p.title, price: p.price, size: p.size, img: p.img })} className="flex h-9 w-9 items-center justify-center rounded-full bg-black text-lg font-bold text-white">
                          +
                        </button>
                      </div>
                      <button onClick={() => removeItem(p.id, p.size)} className="text-sm font-semibold text-rose-500 hover:text-rose-600">
                        Remove item
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <aside className="sticky top-24 space-y-5 rounded-4xl border border-slate-200 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Order summary</div>
                <h2 className="mt-2 text-2xl font-black text-brand-ink">Ready to checkout</h2>
              </div>

              <div className="space-y-3 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                <div className="flex items-center justify-between">
                  <span>Items</span>
                  <span className="font-semibold text-brand-ink">{itemCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Delivery</span>
                  <span className="font-semibold text-brand-ink">Cash on delivery</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-brand-ink">{formatPrice(total)}</span>
                </div>
              </div>

              <div className="rounded-2xl border border-dashed border-slate-300 p-4 text-sm text-slate-600">
                COD order confirmed after you place it. No payment gateway needed.
              </div>

              <div className="space-y-3">
                <Link to={user ? '/checkout' : '/login'} className="inline-flex w-full items-center justify-center rounded-full bg-black px-5 py-4 text-sm font-semibold text-white shadow-lg shadow-black/10">
                  {user ? 'Proceed to checkout' : 'Sign in to checkout'}
                </Link>
                <button onClick={() => clear()} className="inline-flex w-full items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-4 text-sm font-semibold text-slate-700 hover:border-brand-ink hover:text-brand-ink">
                  Clear cart
                </button>
              </div>
            </aside>
          </div>
        )}
      </section>
    </main>
  );
}
