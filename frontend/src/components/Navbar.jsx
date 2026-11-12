import { useEffect, useRef, useState } from 'react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { FiHeart, FiLogOut, FiMenu, FiPackage, FiSearch, FiSettings, FiShoppingBag, FiUser, FiX } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

const navItems = [
  { label: 'Home', to: '/' },
  { label: 'Shop', to: '/shop' },
  { label: 'Custom Print', to: '/custom-print' },
  { label: 'Reviews', to: '/reviews' },
  { label: 'Contact', to: '/contact' },
];

function Navbar() {
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [showCartPill, setShowCartPill] = useState(false);
  const profileMenuRef = useRef(null);
  const { cart, lastAddedItem, clearLastAdded } = useCart();
  const { wishlist } = useWishlist();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const cartCount = cart.reduce((s, p) => s + (p.qty || 0), 0);
  const wishlistCount = wishlist.length;
  const isAdminRole = Boolean(user && ['admin', 'catalog_manager', 'logistics_manager'].includes(user.role));
  const profileTo = isAdminRole ? '/admin/dashboard' : '/profile';

  useEffect(() => {
    function handlePointerDown(event) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
    };
  }, []);

  useEffect(() => {
    if (lastAddedItem) {
      setShowCartPill(true);
      const timer = setTimeout(() => {
        setShowCartPill(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [lastAddedItem]);

  function handleProfileLogout() {
    logout();
    setProfileOpen(false);
    navigate('/login', { replace: true });
  }

  function handleNavigateToCart() {
    setShowCartPill(false);
    if (clearLastAdded) clearLastAdded();
    navigate('/cart');
  }

  return (
    <header className="sticky top-0 z-50 border-b border-white/60 bg-white backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-3">
          <div
            className="flex h-11 w-11 items-center justify-center rounded-2xl text-sm font-black text-white shadow-glow"
            style={{
              backgroundImage: 'linear-gradient(135deg, #FF4D6D 0%, #6C63FF 55%, #FFD166 100%)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'padding-box',
              color: '#ffffff',
            }}
          >
            TL
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">ThreadLab</p>
            <p className="text-lg font-black text-brand-ink">Custom Wear</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-8 lg:flex">
          {navItems.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              className="text-sm font-medium text-slate-700 transition-colors duration-200 hover:text-brand-pink"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:-translate-y-0.5 hover:border-brand-pink hover:text-brand-pink cursor-pointer"
            aria-label="Search"
          >
            <FiSearch />
          </button>
          <Link
            to="/wishlist"
            className="relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:-translate-y-0.5 hover:border-brand-pink hover:text-brand-pink"
            aria-label="Wishlist"
          >
            <FiHeart />
            {wishlistCount > 0 && (
              <span className="absolute -right-2 -top-2 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-semibold text-white">
                {wishlistCount}
              </span>
            )}
          </Link>
          <div className="relative" ref={profileMenuRef}>
            <button
              type="button"
              className={`relative inline-flex h-11 w-11 items-center justify-center rounded-full border transition hover:-translate-y-0.5 overflow-hidden cursor-pointer ${user ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-300 hover:text-emerald-800' : 'border-slate-200 bg-white text-slate-700 hover:border-brand-pink hover:text-brand-pink'}`}
              aria-label={user ? 'Account menu' : 'Login menu'}
              aria-expanded={profileOpen}
              onClick={() => setProfileOpen((value) => !value)}
            >
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} className="h-full w-full rounded-full object-cover" />
              ) : (
                <FiUser />
              )}
              {user && <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" aria-hidden="true" />}
            </button>

            <AnimatePresence>
              {profileOpen ? (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.98 }}
                  className="absolute right-0 top-[3.25rem] w-72 overflow-hidden rounded-3xl border border-slate-200 bg-white p-2 shadow-[0_24px_60px_rgba(15,23,42,0.18)] z-50"
                >
                  <div className="rounded-2xl bg-slate-50 px-4 py-3">
                    <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Account</div>
                    <div className="mt-1 text-sm font-bold text-brand-ink">{user ? user.name : 'Guest user'}</div>
                    <div className="mt-1 text-xs text-slate-500">{user ? user.email : 'Sign in to view your profile and orders'}</div>
                    {user && !isAdminRole && (
                      <div className="mt-2 inline-flex rounded-full bg-slate-900 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-white">
                        Customer account
                      </div>
                    )}
                  </div>

                  {user ? (
                    isAdminRole ? (
                      <div className="mt-2 space-y-1">
                        <Link to="/admin/dashboard" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-brand-mist">
                          <FiSettings />
                          Dashboard
                        </Link>
                        <Link to="/admin/catalog" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-brand-mist">
                          <FiPackage />
                          Catalog
                        </Link>
                        <Link to="/admin/orders" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-brand-mist">
                          <FiPackage />
                          Orders
                        </Link>
                        <Link to="/admin/customers" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-brand-mist">
                          <FiUser />
                          Customers
                        </Link>
                        <button type="button" onClick={handleProfileLogout} className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-semibold text-red-600 transition hover:bg-red-50 cursor-pointer">
                          <FiLogOut />
                          Log out
                        </button>
                      </div>
                    ) : (
                      <div className="mt-2 space-y-1">
                        <Link to="/profile?tab=overview" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-brand-mist">
                          <FiUser />
                          Profile
                        </Link>
                        <Link to="/profile?tab=orders" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-brand-mist">
                          <FiPackage />
                          Orders
                        </Link>
                        <Link to="/profile?tab=addresses" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-brand-mist">
                          <FiSettings />
                          Addresses
                        </Link>
                        <Link to="/wishlist" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-brand-mist">
                          <FiHeart />
                          Wishlist
                        </Link>
                        <button type="button" onClick={handleProfileLogout} className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-semibold text-red-600 transition hover:bg-red-50 cursor-pointer">
                          <FiLogOut />
                          Log out
                        </button>
                      </div>
                    )
                  ) : (
                    <div className="mt-2 space-y-1">
                      <Link to="/login" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-brand-mist">
                        <FiUser />
                        Sign in
                      </Link>
                      <Link to="/register" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-brand-mist">
                        <FiUser />
                        Create account
                      </Link>
                    </div>
                  )}
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>

          {/* Cart Icon and Floating Quick-Redirect Pill */}
          <div className="relative">
            <Link
              to="/cart"
              onClick={() => { setShowCartPill(false); if (clearLastAdded) clearLastAdded(); }}
              className={`relative inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 ${showCartPill ? 'ring-2 ring-brand-pink ring-offset-2' : ''}`}
              style={{ backgroundColor: '#1F2937' }}
            >
              <FiShoppingBag className={showCartPill ? 'text-brand-pink animate-bounce' : ''} />
              Cart
              {cartCount > 0 && (
                <span className="absolute -right-2 -top-2 inline-flex h-6 min-w-[1.25rem] items-center justify-center rounded-full bg-brand-pink px-1.5 text-xs font-semibold text-white">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Quick Cart Pill Notification / Popover */}
            <AnimatePresence>
              {showCartPill && lastAddedItem && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 top-[3.75rem] z-50 w-76 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_20px_50px_rgba(15,23,42,0.2)]"
                >
                  <div className="flex items-start gap-3">
                    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-center">
                      {lastAddedItem.img ? (
                        <img src={lastAddedItem.img} alt={lastAddedItem.title} className="h-full w-full object-cover" />
                      ) : (
                        <FiShoppingBag className="text-slate-400" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-emerald-600">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                        Added to Cart!
                      </div>
                      <p className="truncate text-xs font-bold text-brand-ink mt-0.5">{lastAddedItem.title}</p>
                      <p className="text-[11px] text-slate-500 font-medium">
                        {lastAddedItem.size ? `Size: ${lastAddedItem.size} • ` : ''}₹{lastAddedItem.price}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setShowCartPill(false); if (clearLastAdded) clearLastAdded(); }}
                      className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                    >
                      <FiX className="text-sm" />
                    </button>
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={handleNavigateToCart}
                      className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-brand-ink hover:bg-slate-800 text-white text-xs font-bold transition shadow-sm cursor-pointer"
                    >
                      <FiShoppingBag className="text-xs" />
                      View Cart ({cartCount}) →
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <button
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 lg:hidden cursor-pointer"
          onClick={() => setOpen((value) => !value)}
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          {open ? <FiX /> : <FiMenu />}
        </button>
      </div>

      {/* Mobile Floating Cart Notification Pill */}
      <AnimatePresence>
        {showCartPill && lastAddedItem && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            onClick={handleNavigateToCart}
            className="lg:hidden fixed top-20 right-4 left-4 z-50 flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-900 text-white shadow-2xl cursor-pointer"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-10 w-10 shrink-0 rounded-lg overflow-hidden bg-slate-800 flex items-center justify-center">
                {lastAddedItem.img ? (
                  <img src={lastAddedItem.img} alt="" className="h-full w-full object-cover" />
                ) : (
                  <FiShoppingBag />
                )}
              </div>
              <div className="min-w-0 flex-1 text-left">
                <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Added to cart</p>
                <p className="text-xs font-bold truncate">{lastAddedItem.title}</p>
              </div>
            </div>
            <span className="shrink-0 text-xs font-bold text-brand-pink bg-white/10 px-2.5 py-1.5 rounded-xl">
              View Cart →
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="border-t border-white/60 bg-white/95 px-4 py-5 shadow-lg lg:hidden"
          >
            <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:px-2">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  to={item.to}
                  className="rounded-2xl bg-brand-mist px-4 py-3 text-sm font-semibold text-brand-ink"
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              <div className="flex gap-3 pt-2">
                <button type="button" className="flex-1 rounded-full border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700">
                  Search
                </button>
                <Link to="/wishlist" className="relative flex-1 rounded-full border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 text-center">
                  Wishlist
                  {wishlistCount > 0 && <span className="absolute right-3 top-0 inline-flex h-5 min-w-[1rem] items-center justify-center rounded-full bg-red-500 px-1 text-xs font-semibold text-white">{wishlistCount}</span>}
                </Link>
                <button type="button" onClick={() => setProfileOpen((value) => !value)} className={`relative flex-1 rounded-full px-4 py-3 text-sm font-semibold ${user ? 'border border-emerald-200 bg-emerald-50 text-emerald-700' : 'border border-slate-200 bg-white text-slate-700'}`}>
                  {isAdminRole ? 'Account' : 'Profile'}
                  {user && <span className="absolute right-3 top-0 inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" aria-hidden="true" />}
                </button>
                <Link to="/cart" className="relative flex-1 rounded-full px-4 py-3 text-sm font-semibold text-white text-center" style={{ backgroundColor: '#1F2937' }}>
                  Cart
                  {cartCount > 0 && <span className="absolute right-3 top-0 inline-flex h-5 min-w-[1rem] items-center justify-center rounded-full bg-brand-pink px-1 text-xs font-semibold text-white">{cartCount}</span>}
                </Link>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}

export default Navbar;
