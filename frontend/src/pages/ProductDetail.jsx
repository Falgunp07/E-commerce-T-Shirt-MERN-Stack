import { useParams, Link, useNavigate } from 'react-router-dom';
import { useState, useMemo, useEffect } from 'react';
import { FiChevronLeft, FiChevronRight, FiHeart, FiShoppingBag } from 'react-icons/fi';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { API_BASE_URL } from '../config/api';

function formatPrice(v) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v);
}

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { cart, addItem, updateItemQty, removeItem } = useCart();
  const { wishlist, toggleItem } = useWishlist();
  const [size, setSize] = useState('M');
  const [imgIndex, setImgIndex] = useState(0);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    if (!id) return;
    setLoading(true);
    fetch(`${API_BASE_URL}/api/products/${encodeURIComponent(id)}`)
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
  const wishlisted = wishlist.some((item) => item.id === product?._id);

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
    addItem({ id: product._id, title: product.title, price: product.price, size, color: product.color, img: displayedSrc || product.img });
  }

  function handleBuyNow() {
    addItem({ id: product._id, title: product.title, price: product.price, size, color: product.color, img: displayedSrc || product.img, qty: 1 });
    navigate('/checkout');
  }

  function handleInc() {
    addItem({ id: product._id, title: product.title, price: product.price, size, color: product.color, img: displayedSrc || product.img, qty: 1 });
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

              {/* Primary action buttons: Add to Cart / Qty Counter & Buy Now */}
              <div className="mt-6 space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 items-center">
                  {qty > 0 ? (
                    <div className="flex items-center gap-2.5 h-12">
                      <div className="flex flex-1 items-center justify-between rounded-full border border-slate-300 bg-slate-50 px-3 h-full shadow-xs">
                        <button
                          onClick={handleDec}
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-white border border-slate-200 text-base font-bold text-slate-800 hover:bg-slate-200 transition cursor-pointer"
                          aria-label="Decrease quantity"
                        >
                          -
                        </button>
                        <span className="text-xs sm:text-sm font-bold text-slate-800">
                          In cart: {qty}
                        </span>
                        <button
                          onClick={handleInc}
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-black text-base font-bold text-white hover:bg-slate-800 transition cursor-pointer"
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => navigate('/cart')}
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-slate-300 bg-white text-black shadow-xs transition hover:border-black hover:bg-slate-50 cursor-pointer"
                        title="View Cart"
                        aria-label="View Cart"
                      >
                        <FiShoppingBag className="text-lg text-black" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={handleAdd}
                      className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-black px-6 text-sm font-bold text-white shadow-sm hover:bg-slate-800 active:scale-[0.98] transition cursor-pointer"
                    >
                      <FiShoppingBag className="text-base" />
                      Add to cart
                    </button>
                  )}

                  <button
                    onClick={handleBuyNow}
                    className="flex h-12 w-full items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 px-6 text-sm font-bold text-white shadow-md shadow-emerald-500/20 hover:from-emerald-500 hover:to-teal-500 active:scale-[0.98] transition cursor-pointer"
                  >
                    <span>Buy Now (COD)</span>
                    <span className="text-base font-normal">&rarr;</span>
                  </button>
                </div>

                {/* Secondary action button: Wishlist */}
                <button
                  onClick={() => toggleItem({ id: product._id, title: product.title, price: product.price, img: product.img })}
                  className={`flex h-11 w-full items-center justify-center gap-2 rounded-full border text-sm font-semibold transition-all duration-200 shadow-xs cursor-pointer ${
                    wishlisted
                      ? 'border-red-500 bg-red-50 text-red-600 hover:bg-red-100'
                      : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50'
                  }`}
                >
                  <FiHeart className={`text-base ${wishlisted ? 'fill-red-500 text-red-500' : 'text-slate-500'}`} />
                  <span>{wishlisted ? 'Saved in Wishlist' : 'Add to Wishlist'}</span>
                </button>
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
