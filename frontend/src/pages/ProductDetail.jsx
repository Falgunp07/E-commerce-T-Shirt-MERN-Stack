import { useParams, Link } from 'react-router-dom';
import { useState, useMemo, useEffect } from 'react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { useCart } from '../context/CartContext';

function formatPrice(v) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v);
}

export default function ProductDetail() {
  const { id } = useParams();
  const { cart, addItem, updateItemQty, removeItem } = useCart();
  const [size, setSize] = useState('M');
  const [imgIndex, setImgIndex] = useState(0);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    if (!id) return;
    setLoading(true);
    fetch(`http://localhost:5000/api/products/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (!mounted) return;
        if (data && data.success) setProduct(data.product);
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [id]);

  const existing = useMemo(() => {
    // prefer exact size match, otherwise any item with same id
    const exact = cart.find((p) => p.id === product?._id && p.size === size);
    if (exact) return exact;
    return cart.find((p) => p.id === product?._id);
  }, [cart, product, size]);

  const qty = existing?.qty || 0;

  if (loading) {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-3xl items-center justify-center p-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">Loading...</div>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-3xl items-center justify-center p-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-black text-brand-ink">Product not found</h1>
          <p className="mt-2 text-slate-600">The item you are looking for does not exist anymore.</p>
          <Link to="/products" className="mt-6 inline-flex rounded-full bg-black px-5 py-3 text-sm font-semibold text-white">
            Back to products
          </Link>
        </div>
      </main>
    );
  }

  const images = product.images && product.images.length ? product.images : product.img ? [product.img] : [];
  const displayedSrc = images[imgIndex] || '';

  function prevImage(e) {
    e?.stopPropagation();
    setImgIndex((i) => (images.length ? (i - 1 + images.length) % images.length : 0));
  }

  function nextImage(e) {
    e?.stopPropagation();
    setImgIndex((i) => (images.length ? (i + 1) % images.length : 0));
  }

  function handleAdd() {
    addItem({ id: product._id, title: product.title, price: product.price, size });
  }

  function handleInc() {
    addItem({ id: product._id, title: product.title, price: product.price, size, qty: 1 });
  }

  function handleDec() {
    if (!existing) return;
    const newQty = existing.qty - 1;
    if (newQty <= 0) {
      removeItem(product._id, existing.size);
    } else {
      updateItemQty(product._id, existing.size, newQty);
    }
  }

  return (
    <main className="bg-[radial-gradient(circle_at_top,_rgba(108,99,255,0.12),_transparent_34%),linear-gradient(180deg,_#fff,_#f8fafc_55%,_#fff)]">
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center gap-2 text-sm text-slate-500">
          <Link to="/products" className="font-medium text-brand-ink hover:underline">Products</Link>
          <span>/</span>
          <span>{product.title}</span>
        </div>

        <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
          <div className="relative overflow-hidden">
              <div className="h-[320px] sm:h-[360px] md:h-[420px] w-full overflow-hidden">
                <img src={displayedSrc} alt={product.title} className="h-full w-full object-contain object-top mx-auto" />
              </div>
              {images.length > 1 && (
                <>
                  <button onClick={(e) => { e.stopPropagation(); prevImage(); }} aria-label="Previous image" className="absolute left-3 top-1/2 -translate-y-1/2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-brand-ink shadow-md">
                    <FiChevronLeft />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); nextImage(); }} aria-label="Next image" className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-brand-ink shadow-md">
                    <FiChevronRight />
                  </button>
                  <div className="absolute left-1/2 bottom-3 -translate-x-1/2 rounded-full bg-white/90 px-3 py-1 text-sm font-medium text-slate-700 shadow-sm">{imgIndex + 1} / {images.length}</div>
                </>
              )}
          </div>

          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <span className="inline-flex rounded-full bg-brand-gold/20 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-ink">Premium drop</span>
                <h1 className="mt-2 text-lg font-semibold tracking-tight text-brand-ink">{product.title}</h1>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <div className="rounded-full bg-slate-50 px-3 py-1 text-sm font-medium text-slate-600">Soft cotton</div>
                <div className="rounded-full bg-slate-50 px-3 py-1 text-sm font-medium text-slate-600">Unisex fit</div>
              </div>

              <div className="mt-4 flex items-end justify-between rounded-lg bg-slate-50 px-3 py-2">
                <div>
                  <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">Starting at</div>
                  <div className="text-2xl font-bold text-brand-ink">{formatPrice(product.price)}</div>
                </div>
                <div className="text-right text-sm text-slate-500">Ships in 2-4 days</div>
              </div>

                <p className="mt-3 text-sm leading-5 text-slate-600">{product.description}</p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                  <h2 className="text-sm font-medium text-brand-ink">Choose size</h2>
                <span className="text-sm text-slate-500">Select before adding</span>
              </div>
              <div className="mt-3 flex gap-2">
                {['S', 'M', 'L'].map((s) => (
                  <button key={s} onClick={() => setSize(s)} className={`min-w-12 rounded-full border px-3 py-2 text-sm font-medium transition ${size === s ? 'border-black bg-black text-white' : 'border-slate-300 bg-white text-slate-700 hover:border-brand-ink hover:text-brand-ink'}`}>
                    {s}
                  </button>
                ))}
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg bg-slate-50 p-3">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Fit</div>
                  <div className="mt-1 font-semibold text-brand-ink">Relaxed oversized</div>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Care</div>
                  <div className="mt-1 font-semibold text-brand-ink">Cold wash, inside out</div>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2">
                {qty > 0 ? (
                  <div className="flex w-full items-center gap-2 rounded-full border border-slate-200 px-3 py-1">
                    <button onClick={handleDec} className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-brand-ink">-</button>
                    <div className="flex-1 text-center text-sm font-semibold text-slate-700">In cart: {qty}</div>
                    <button onClick={handleInc} className="flex h-8 w-8 items-center justify-center rounded-full bg-black text-sm font-bold text-white">+</button>
                  </div>
                ) : (
                  <button onClick={handleAdd} className="w-full rounded-full bg-black px-4 py-2 text-sm font-semibold text-white shadow-sm">Add to cart</button>
                )}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {[
                ['Print', 'High-resolution DTG'],
                ['Fabric', 'Heavyweight cotton'],
                ['Delivery', 'COD available'],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-slate-200 bg-white p-3 text-center shadow-sm">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</div>
                  <div className="mt-1 font-semibold text-brand-ink">{value}</div>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="text-sm font-semibold text-brand-ink">More about description</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{product.description} More about this product: premium fabrics, precise printing, and durable construction designed to last through multiple washes. Fits true to size for most wearers.</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
