import { useParams, Link, useNavigate } from 'react-router-dom';
import { useState, useMemo, useEffect } from 'react';
import { FiChevronLeft, FiChevronRight, FiHeart, FiShoppingBag, FiCheck, FiTruck, FiShield, FiRefreshCw, FiX } from 'react-icons/fi';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { API_BASE_URL } from '../config/api';

function formatPrice(v) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v);
}

const SIZE_GUIDE_DATA = [
  { size: 'S', chest: '38 in / 96 cm', length: '27 in / 68 cm', shoulder: '17 in / 43 cm' },
  { size: 'M', chest: '40 in / 101 cm', length: '28 in / 71 cm', shoulder: '18 in / 46 cm' },
  { size: 'L', chest: '42 in / 106 cm', length: '29 in / 74 cm', shoulder: '19 in / 48 cm' },
  { size: 'XL', chest: '44 in / 112 cm', length: '30 in / 76 cm', shoulder: '20 in / 51 cm' },
  { size: 'XXL', chest: '46 in / 117 cm', length: '31 in / 79 cm', shoulder: '21 in / 53 cm' },
];

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { cart, addItem, updateItemQty, removeItem } = useCart();
  const { wishlist, toggleItem } = useWishlist();
  const [size, setSize] = useState('M');
  const [imgIndex, setImgIndex] = useState(0);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    let mounted = true;
    if (!id) return;
    setLoading(true);
    fetch(`${API_BASE_URL}/api/products/${encodeURIComponent(id)}`)
      .then((r) => r.json())
      .then((data) => {
        if (!mounted) return;
        if (data && data.success && data.product) {
          setProduct(data.product);
          // Set initial size from first available variant if present
          if (Array.isArray(data.product.variants) && data.product.variants.length > 0) {
            setSize(data.product.variants[0].size || 'M');
          }
        }
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [id]);

  useEffect(() => {
    let mounted = true;
    fetch(`${API_BASE_URL}/api/reviews`)
      .then((r) => r.json())
      .then((data) => {
        if (!mounted) return;
        if (data.success && Array.isArray(data.reviews)) {
          setReviews(data.reviews.slice(0, 3));
        }
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  const availableSizes = useMemo(() => {
    if (product && Array.isArray(product.variants) && product.variants.length > 0) {
      const unique = [...new Set(product.variants.map((v) => v.size))];
      return unique.length ? unique : ['S', 'M', 'L', 'XL'];
    }
    return ['S', 'M', 'L', 'XL'];
  }, [product]);

  const activeVariant = useMemo(() => {
    if (!product || !Array.isArray(product.variants)) return null;
    return product.variants.find((v) => v.size === size) || product.variants[0] || null;
  }, [product, size]);

  const currentStock = activeVariant?.stock ?? 15;
  const isOutOfStock = currentStock <= 0;

  const existing = useMemo(() => {
    const exact = cart.find((p) => p.id === product?._id && p.size === size);
    if (exact) return exact;
    return cart.find((p) => p.id === product?._id);
  }, [cart, product, size]);

  const qty = existing?.qty || 0;
  const wishlisted = wishlist.some((item) => item.id === product?._id);

  if (loading) {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-3xl items-center justify-center p-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="inline-block animate-spin h-8 w-8 border-4 border-slate-900 border-t-transparent rounded-full mb-3" />
          <p className="text-sm font-semibold text-slate-600">Loading product details...</p>
        </div>
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
    if (isOutOfStock) {
      alert('This size is currently out of stock.');
      return;
    }
    addItem({ id: product._id, title: product.title, price: product.price, size, color: product.color, img: displayedSrc || product.img });
  }

  function handleBuyNow() {
    if (isOutOfStock) {
      alert('This size is currently out of stock.');
      return;
    }
    addItem({ id: product._id, title: product.title, price: product.price, size, color: product.color, img: displayedSrc || product.img, qty: 1 });
    navigate('/checkout');
  }

  function handleInc() {
    if (qty >= currentStock) {
      alert(`Only ${currentStock} items in stock for size ${size}.`);
      return;
    }
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
    <main className="bg-[radial-gradient(circle_at_top,_rgba(108,99,255,0.08),_transparent_34%),linear-gradient(180deg,_#fff,_#f8fafc_55%,_#fff)]">
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Breadcrumbs */}
        <div className="mb-6 flex items-center gap-2 text-xs sm:text-sm text-slate-500">
          <Link to="/" className="hover:text-black">Home</Link>
          <span>/</span>
          <Link to="/shop" className="hover:text-black">Catalog</Link>
          <span>/</span>
          <span className="font-semibold text-slate-800 truncate">{product.title}</span>
        </div>

        <div className="grid gap-8 lg:grid-cols-[460px_1fr] items-start">
          {/* Product Image Gallery */}
          <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="h-[340px] sm:h-[400px] md:h-[460px] w-full overflow-hidden flex items-center justify-center">
              <img
                src={displayedSrc}
                alt={product.title}
                className="h-full w-full object-contain mx-auto transition-transform duration-300 hover:scale-105"
              />
            </div>
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={prevImage}
                  aria-label="Previous image"
                  className="absolute left-4 top-1/2 -translate-y-1/2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-brand-ink shadow-md hover:bg-white transition cursor-pointer"
                >
                  <FiChevronLeft className="text-xl" />
                </button>
                <button
                  type="button"
                  onClick={nextImage}
                  aria-label="Next image"
                  className="absolute right-4 top-1/2 -translate-y-1/2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-brand-ink shadow-md hover:bg-white transition cursor-pointer"
                >
                  <FiChevronRight className="text-xl" />
                </button>
                <div className="absolute left-1/2 bottom-4 -translate-x-1/2 rounded-full bg-black/80 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                  {imgIndex + 1} / {images.length}
                </div>
              </>
            )}
          </div>

          {/* Product Info & Actions */}
          <div className="space-y-5">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex rounded-full bg-brand-gold/20 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-brand-ink">
                  Streetwear Edition
                </span>
                {product.color && (
                  <span className="text-xs font-semibold text-slate-500 border border-slate-200 px-2.5 py-0.5 rounded-full">
                    Color: {product.color}
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-brand-ink">{product.title}</h1>

              {/* Price & Stock Badge */}
              <div className="flex flex-wrap items-center justify-between rounded-2xl bg-slate-50 p-4 border border-slate-100">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">Price (Inclusive of all taxes)</div>
                  <div className="text-3xl font-black text-brand-ink mt-0.5">{formatPrice(product.price)}</div>
                </div>
                <div className="text-right">
                  {isOutOfStock ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-bold">
                      Out of stock
                    </span>
                  ) : currentStock <= 5 ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold animate-pulse">
                      Only {currentStock} left in stock!
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                      <FiCheck className="text-sm" /> In Stock • Ships in 2-4 days
                    </span>
                  )}
                  <div className="text-[11px] text-slate-500 mt-1">Cash on Delivery Available</div>
                </div>
              </div>

              {/* Description */}
              <p className="text-sm leading-relaxed text-slate-600">{product.description}</p>
            </div>

            {/* Size Selector & Size Guide */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-brand-ink">Select Garment Size</h2>
                  <p className="text-xs text-slate-500">Pick your fit before placing order</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSizeGuideOpen(true)}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
                >
                  📏 View Size Guide
                </button>
              </div>

              <div className="flex flex-wrap gap-2.5 pt-1">
                {availableSizes.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSize(s)}
                    className={`min-w-14 rounded-2xl border px-4 py-2.5 text-xs font-bold transition cursor-pointer ${
                      size === s
                        ? 'border-black bg-black text-white shadow-sm ring-2 ring-black/10'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-400'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>

              {/* Action Buttons: Add to Cart / Qty Counter & Buy Now */}
              <div className="pt-2 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                  {qty > 0 ? (
                    <div className="flex items-center gap-2.5 h-12">
                      <div className="flex flex-1 items-center justify-between rounded-full border border-slate-300 bg-slate-50 px-3 h-full shadow-xs">
                        <button
                          type="button"
                          onClick={handleDec}
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-white border border-slate-200 text-base font-bold text-slate-800 hover:bg-slate-200 transition cursor-pointer"
                          aria-label="Decrease quantity"
                        >
                          -
                        </button>
                        <span className="text-xs sm:text-sm font-bold text-slate-800">
                          In cart: {qty} ({size})
                        </span>
                        <button
                          type="button"
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
                      type="button"
                      onClick={handleAdd}
                      disabled={isOutOfStock}
                      className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-black px-6 text-sm font-bold text-white shadow-sm hover:bg-slate-800 active:scale-[0.98] disabled:opacity-50 transition cursor-pointer"
                    >
                      <FiShoppingBag className="text-base" />
                      {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleBuyNow}
                    disabled={isOutOfStock}
                    className="flex h-12 w-full items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 px-6 text-sm font-bold text-white shadow-md shadow-emerald-500/20 hover:from-emerald-500 hover:to-teal-500 active:scale-[0.98] disabled:opacity-50 transition cursor-pointer"
                  >
                    <span>Buy Now (COD)</span>
                    <span className="text-base font-normal">&rarr;</span>
                  </button>
                </div>

                {/* Wishlist Button */}
                <button
                  type="button"
                  onClick={() => toggleItem({ id: product._id, title: product.title, price: product.price, img: product.img })}
                  className={`flex h-11 w-full items-center justify-center gap-2 rounded-full border text-xs font-bold transition-all duration-200 shadow-xs cursor-pointer ${
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

            {/* Assurance Strips */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-3 text-center">
                <FiTruck className="text-lg mx-auto text-indigo-600 mb-1" />
                <div className="text-[11px] font-bold text-slate-800">Pan-India COD</div>
                <div className="text-[10px] text-slate-400">Zero-risk delivery</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-3 text-center">
                <FiShield className="text-lg mx-auto text-emerald-600 mb-1" />
                <div className="text-[11px] font-bold text-slate-800">100% Combed Cotton</div>
                <div className="text-[10px] text-slate-400">240+ GSM fabric</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-3 text-center">
                <FiRefreshCw className="text-lg mx-auto text-rose-600 mb-1" />
                <div className="text-[11px] font-bold text-slate-800">7-Day Easy Returns</div>
                <div className="text-[10px] text-slate-400">Hassle-free replacement</div>
              </div>
            </div>
          </div>
        </div>

        {/* Product Reviews Preview Section */}
        <div className="mt-14 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
          <div className="flex items-center justify-between pb-6 border-b border-slate-100">
            <div>
              <h3 className="text-xl font-black text-brand-ink">Customer Feedback</h3>
              <p className="text-xs text-slate-500 mt-1">Verified reviews from streetwear collectors</p>
            </div>
            <Link to="/reviews" className="text-xs font-bold text-indigo-600 hover:underline">
              View All Reviews ({reviews.length}) &rarr;
            </Link>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {reviews.map((rev, i) => (
              <div key={rev._id || i} className="rounded-2xl border border-slate-100 bg-slate-50 p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1 text-amber-400 text-xs mb-2">
                    {'★'.repeat(rev.rating || 5)}
                  </div>
                  <p className="text-xs leading-relaxed text-slate-600 line-clamp-3">“{rev.quote}”</p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                  <span className="font-bold text-slate-800">{rev.name}</span>
                  <span className="text-emerald-600 font-semibold text-[10px]">✓ Verified</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Size Guide Modal */}
      {sizeGuideOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div>
                <h3 className="text-lg font-black text-brand-ink">T-Shirt Size Guide</h3>
                <p className="text-xs text-slate-500">Unisex Oversized & Regular Streetwear Fit (Inches & CM)</p>
              </div>
              <button
                type="button"
                onClick={() => setSizeGuideOpen(false)}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
              >
                <FiX className="text-lg" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider">
                    <th className="p-2.5 rounded-l-xl">Size</th>
                    <th className="p-2.5">Chest</th>
                    <th className="p-2.5">Length</th>
                    <th className="p-2.5 rounded-r-xl">Shoulder</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {SIZE_GUIDE_DATA.map((row) => (
                    <tr key={row.size} className={size === row.size ? 'bg-indigo-50 font-bold text-indigo-900' : ''}>
                      <td className="p-2.5 font-bold">{row.size}</td>
                      <td className="p-2.5">{row.chest}</td>
                      <td className="p-2.5">{row.length}</td>
                      <td className="p-2.5">{row.shoulder}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="rounded-2xl bg-slate-50 p-3 text-[11px] text-slate-500 leading-relaxed border border-slate-200">
              💡 <strong>Fitting Tip:</strong> For a streetwear oversized boxy look, order your standard size. If you prefer a regular tailored fit, consider sizing down.
            </div>

            <button
              type="button"
              onClick={() => setSizeGuideOpen(false)}
              className="w-full rounded-2xl bg-black py-3 text-xs font-bold text-white hover:bg-slate-800 transition cursor-pointer"
            >
              Got it, close guide
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
