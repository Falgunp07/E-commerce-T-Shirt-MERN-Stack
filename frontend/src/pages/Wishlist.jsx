import { Link, useNavigate } from 'react-router-dom';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { FiShoppingBag, FiTrash2 } from 'react-icons/fi';

function formatPrice(v) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v);
}

export default function Wishlist() {
  const { wishlist, removeItem, clear } = useWishlist();
  const { addItem } = useCart();
  const navigate = useNavigate();

  const handleMoveToCart = (item) => {
    addItem({
      id: item.id,
      title: item.title,
      price: item.price,
      size: item.size || 'M',
      color: item.color || 'Black',
      img: item.img,
      qty: 1,
    });
    removeItem(item.id);
  };

  return (
    <main className="bg-brand-gradient">
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="inline-flex rounded-full bg-brand-gold/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-brand-ink">Wishlist</span>
            <h1 className="mt-4 text-4xl font-black tracking-tight text-brand-ink">Saved items you want to buy later.</h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">Keep track of products you like and move them to your cart whenever you are ready.</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Saved</div>
            <div className="text-3xl font-black text-brand-ink">{wishlist.length}</div>
          </div>
        </div>

        {wishlist.length === 0 ? (
          <div className="rounded-4xl border border-slate-200 bg-white p-8 text-center shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
            <h2 className="text-2xl font-black text-brand-ink">No wishlist items yet</h2>
            <p className="mt-2 text-slate-600">Tap the heart button on any product to save it here.</p>
            <Link to="/shop" className="mt-6 inline-flex rounded-full bg-black px-5 py-3 text-sm font-semibold text-white">
              Browse products
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {wishlist.map((item) => (
              <article key={item.id} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
                <div className="bg-white p-3">
                  <img src={item.img} alt={item.title} className="h-72 w-full object-contain bg-white p-2" />
                </div>
                <div className="p-5">
                  <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Wishlist item</div>
                  <h3 className="mt-2 text-xl font-extrabold text-brand-ink">{item.title}</h3>
                  <div className="mt-3 text-lg font-black text-brand-ink">{formatPrice(item.price)}</div>
                  <div className="mt-5 flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => handleMoveToCart(item)}
                      className="w-full flex items-center justify-center gap-2 rounded-full bg-black px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-800 transition cursor-pointer shadow-sm"
                    >
                      <FiShoppingBag className="text-sm" />
                      Move to Cart
                    </button>
                    <div className="flex gap-2">
                      <Link
                        to={`/product/${item.id}`}
                        className="flex-1 rounded-full border border-slate-300 bg-white py-2 text-center text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                      >
                        View Details
                      </Link>
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                        title="Remove from wishlist"
                      >
                        <FiTrash2 className="text-sm" />
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {wishlist.length > 0 && (
          <div className="mt-8 flex justify-end">
            <button onClick={() => clear()} className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:border-brand-ink hover:text-brand-ink">
              Clear wishlist
            </button>
          </div>
        )}
      </section>
    </main>
  );
}