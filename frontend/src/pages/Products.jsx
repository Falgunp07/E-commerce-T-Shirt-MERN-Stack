import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { FiHeart } from 'react-icons/fi';

// Fetch products from backend API instead of using local mock data
// Backend endpoint: GET /api/products

const COLOR_OPTIONS = [
  'All',
  'Black',
  'White',
  'Grey',
  'Pink',
  'Blue',
  'Red',
  'Yellow',
  'Orange',
  'Green',
  'Neon Green',
  'Lavender',
  'Maroon',
  'Brown',
  'Charcoal',
  'Navy',
  'Sky Blue',
];

export default function Products() {
  const navigate = useNavigate();
  const { cart, addItem, updateItemQty, removeItem } = useCart();
  const { wishlist, toggleItem } = useWishlist();
  const [products, setProducts] = useState([]);
  const [query, setQuery] = useState('');
  const [color, setColor] = useState('All');
  const [sortBy, setSortBy] = useState('featured');
  const [priceBand, setPriceBand] = useState('all');

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

  const colors = COLOR_OPTIONS.filter((item) => item === 'All' || products.some((product) => product.color === item));

  const filteredProducts = products
    .filter((product) => {
      const matchesQuery = `${product.title} ${product.description || ''}`.toLowerCase().includes(query.toLowerCase());
      const matchesColor = color === 'All' || product.color === color;
      const matchesPrice =
        priceBand === 'all' ||
        (priceBand === 'under1000' && product.price < 1000) ||
        (priceBand === '1000to2000' && product.price >= 1000 && product.price <= 2000) ||
        (priceBand === 'above2000' && product.price > 2000);
      return matchesQuery && matchesColor && matchesPrice;
    })
    .sort((a, b) => {
      if (sortBy === 'priceLow') return a.price - b.price;
      if (sortBy === 'priceHigh') return b.price - a.price;
      if (sortBy === 'name') return a.title.localeCompare(b.title);
      return 0;
    });

  function isWishlisted(productId) {
    return wishlist.some((item) => item.id === productId);
  }

  function getCartItem(productId) {
    return cart.find((item) => item.id === productId && (item.size ?? null) === null);
  }

  function openProduct(productId) {
    navigate(`/product/${productId}`);
  }

  function handleCardClick(e, productId) {
    if (e.target.closest('button, a, input, select, textarea')) return;
    openProduct(productId);
  }

  function handleCardKeyDown(e, productId) {
    if (e.target !== e.currentTarget) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openProduct(productId);
    }
  }

  return (
    <main className="bg-brand-gradient">
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div>
            <span className="inline-flex items-center rounded-full bg-brand-gold/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-brand-ink">
              Curated Collection
            </span>
            <h1 className="mt-4 max-w-2xl text-4xl font-black tracking-tight text-brand-ink sm:text-5xl">
              Explore premium t-shirts made for custom streetwear drops.
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

        <div className="mt-8 rounded-3xl border border-white/70 bg-white/80 p-4 shadow-[0_20px_50px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="grid gap-4 lg:grid-cols-4">
            <label className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-4 text-sm font-semibold text-brand-ink">
              Search
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search products"
                className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-normal outline-none focus:border-brand-ink"
              />
            </label>

            <label className="flex max-w-xs flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-4 text-sm font-semibold text-brand-ink lg:col-span-1">
              Color
              <select
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-full rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-normal outline-none focus:border-brand-ink"
              >
                {colors.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-4 text-sm font-semibold text-brand-ink">
              Price Range
              <select
                value={priceBand}
                onChange={(e) => setPriceBand(e.target.value)}
                className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-normal outline-none focus:border-brand-ink"
              >
                <option value="all">All</option>
                <option value="under1000">Under ₹1000</option>
                <option value="1000to2000">₹1000 - ₹2000</option>
                <option value="above2000">Above ₹2000</option>
              </select>
            </label>

            <label className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-4 text-sm font-semibold text-brand-ink">
              Sort By
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-normal outline-none focus:border-brand-ink"
              >
                <option value="featured">Featured</option>
                <option value="priceLow">Price: Low to High</option>
                <option value="priceHigh">Price: High to Low</option>
                <option value="name">Name: A to Z</option>
              </select>
            </label>
          </div>

          
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredProducts.map((p) => {
            const cartItem = getCartItem(p._id);
            const qty = cartItem?.qty || 0;

            return (
              <article
                key={p._id}
                onClick={(e) => handleCardClick(e, p._id)}
                onKeyDown={(e) => handleCardKeyDown(e, p._id)}
                role="button"
                tabIndex={0}
                className="group cursor-pointer overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_12px_30px_rgba(15,23,42,0.08)] transition-transform duration-300 hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-brand-ink/20"
              >
              <div className="relative overflow-hidden">
                <div className="bg-white p-3">
                  <img src={p.img} alt={p.title} className="h-80 w-full object-contain transition-transform duration-500 group-hover:scale-105" />
                </div>
                <div className="absolute left-4 top-4 rounded-full bg-black px-3 py-1 text-xs font-semibold text-white">New Drop</div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleItem({ id: p._id, title: p.title, price: p.price, img: p.img });
                  }}
                  aria-label={isWishlisted(p._id) ? 'Remove from wishlist' : 'Add to wishlist'}
                  className={`absolute right-4 top-4 inline-flex h-11 w-11 items-center justify-center rounded-full border text-lg shadow-sm transition ${isWishlisted(p._id) ? 'border-red-500 bg-red-500 text-white' : 'border-slate-200 bg-white/95 text-slate-700 hover:border-brand-pink hover:text-brand-pink'}`}
                >
                  <FiHeart className={isWishlisted(p._id) ? 'fill-current' : ''} />
                </button>
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

                <div className="mt-5 flex items-center justify-center">
                  {qty > 0 ? (
                    <div className="inline-flex h-10 items-center overflow-hidden rounded-full border border-slate-200 bg-white shadow-sm">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (qty <= 1) removeItem(p._id, null);
                          else updateItemQty(p._id, null, qty - 1);
                        }}
                        className="flex h-10 w-11 items-center justify-center text-lg font-bold text-brand-ink transition hover:bg-slate-100"
                        aria-label={`Remove one ${p.title} from cart`}
                      >
                        -
                      </button>
                      <span className="flex h-10 min-w-12 items-center justify-center bg-black px-3 text-sm font-bold text-white">{qty}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          addItem({ id: p._id, title: p.title, price: p.price, img: p.img });
                        }}
                        className="flex h-10 w-11 items-center justify-center text-lg font-bold text-brand-ink transition hover:bg-slate-100"
                        aria-label={`Add one more ${p.title} to cart`}
                      >
                        +
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        addItem({ id: p._id, title: p.title, price: p.price, img: p.img });
                      }}
                      className="flex-none inline-flex h-10 items-center justify-center rounded-full bg-black px-4 text-sm font-semibold text-white shadow transition hover:opacity-90 whitespace-nowrap"
                    >
                      Add to cart
                    </button>
                  )}
                </div>
              </div>
            </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
