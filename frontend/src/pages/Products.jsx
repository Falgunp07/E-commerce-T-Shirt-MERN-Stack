import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useCart } from '../context/CartContext';

// Fetch products from backend API instead of using local mock data
// Backend endpoint: GET /api/products

export default function Products() {
  const navigate = useNavigate();
  const { addItem } = useCart();
  const [products, setProducts] = useState([]);

  useEffect(() => {
    let mounted = true;
    fetch('http://localhost:5000/api/products')
      .then((r) => r.json())
      .then((data) => {
        if (!mounted) return;
        if (data && data.success && Array.isArray(data.products)) setProducts(data.products);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <main className="bg-brand-gradient">
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div>
            <span className="inline-flex items-center rounded-full bg-brand-gold/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-brand-ink">
              Curated Collection
            </span>
            <h1 className="mt-4 max-w-2xl text-4xl font-black tracking-tight text-brand-ink sm:text-5xl">
              Explore premium tees and hoodies made for custom streetwear drops.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
              Browse the collection, inspect details, choose sizes, and add straight to cart for a clean COD checkout.
            </p>
          </div>

          <div className="rounded-3xl border border-white/70 bg-white/80 p-5 shadow-[0_20px_50px_rgba(15,23,42,0.08)] backdrop-blur">
            <div className="grid grid-cols-3 gap-3 text-center text-sm">
              <div className="rounded-2xl bg-slate-50 px-3 py-4">
                <div className="text-2xl font-black text-brand-ink">03</div>
                <div className="mt-1 text-slate-500">Drops</div>
              </div>
              <div className="rounded-2xl bg-slate-50 px-3 py-4">
                <div className="text-2xl font-black text-brand-ink">S-XXL</div>
                <div className="mt-1 text-slate-500">Sizes</div>
              </div>
              <div className="rounded-2xl bg-slate-50 px-3 py-4">
                <div className="text-2xl font-black text-brand-ink">COD</div>
                <div className="mt-1 text-slate-500">Checkout</div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap gap-3 text-sm font-medium text-slate-600">
          <span className="rounded-full border border-slate-200 bg-white px-4 py-2">Oversized fit</span>
          <span className="rounded-full border border-slate-200 bg-white px-4 py-2">Soft cotton</span>
          <span className="rounded-full border border-slate-200 bg-white px-4 py-2">High-contrast print</span>
          <span className="rounded-full border border-slate-200 bg-white px-4 py-2">Fast COD ordering</span>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {products.map((p) => (
            <article key={p._id} className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_12px_30px_rgba(15,23,42,0.08)] transition-transform duration-300 hover:-translate-y-1">
              <div className="relative overflow-hidden">
                <img src={p.img} alt={p.title} className="h-80 w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                <div className="absolute left-4 top-4 rounded-full bg-black px-3 py-1 text-xs font-semibold text-white">New Drop</div>
                <div className="absolute bottom-4 right-4 rounded-full bg-white/90 px-3 py-1 text-sm font-semibold text-brand-ink shadow">
                  ₹{p.price}
                </div>
              </div>
              <div className="p-5">
                <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Streetwear / Custom</div>
                <h3 className="mt-2 text-xl font-extrabold text-brand-ink">{p.title}</h3>
                <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">{p.description}</p>

                <div className="mt-5 flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                  <div>
                    <div className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">Price</div>
                    <div className="text-lg font-black text-brand-ink">₹{p.price}</div>
                  </div>
                  <div className="text-right text-xs font-medium text-slate-500">
                    Size <span className="font-semibold text-brand-ink">S M L</span>
                  </div>
                </div>

                <div className="mt-5 flex items-center gap-3 flex-nowrap">
                  <button
                    onClick={() => addItem({ id: p._id, title: p.title, price: p.price })}
                    className="flex-none inline-flex items-center justify-center h-10 rounded-full bg-black px-4 text-sm font-semibold text-white shadow transition hover:opacity-90 whitespace-nowrap"
                  >
                    Add to cart
                  </button>
                  <button
                    onClick={() => navigate(`/product/${p._id}`)}
                    className="flex-none inline-flex items-center justify-center h-10 rounded-full border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-brand-ink hover:text-brand-ink whitespace-nowrap"
                  >
                    View details
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
