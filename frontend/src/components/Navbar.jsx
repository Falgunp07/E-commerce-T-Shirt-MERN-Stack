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
  const profileMenuRef = useRef(null);
  const { cart } = useCart();
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

  function handleProfileLogout() {
    logout();
    setProfileOpen(false);
    navigate('/login', { replace: true });
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
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:-translate-y-0.5 hover:border-brand-pink hover:text-brand-pink"
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
              className={`relative inline-flex h-11 w-11 items-center justify-center rounded-full border transition hover:-translate-y-0.5 ${user ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-300 hover:text-emerald-800' : 'border-slate-200 bg-white text-slate-700 hover:border-brand-pink hover:text-brand-pink'}`}
              aria-label={user ? 'Account menu' : 'Login menu'}
              aria-expanded={profileOpen}
              onClick={() => setProfileOpen((value) => !value)}
            >
              <FiUser />
              {user && <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" aria-hidden="true" />}
            </button>

            <AnimatePresence>
              {profileOpen ? (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.98 }}
                  className="absolute right-0 top-[3.25rem] w-72 overflow-hidden rounded-3xl border border-slate-200 bg-white p-2 shadow-[0_24px_60px_rgba(15,23,42,0.18)]"
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
                        <button type="button" onClick={handleProfileLogout} className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-semibold text-red-600 transition hover:bg-red-50">
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
                        <button type="button" onClick={handleProfileLogout} className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-semibold text-red-600 transition hover:bg-red-50">
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
          <Link to="/cart" className="relative inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-white transition" style={{ backgroundColor: '#1F2937' }}>
            <FiShoppingBag />
            Cart
            {cartCount > 0 && (
              <span className="absolute -right-2 -top-2 inline-flex h-6 min-w-[1.25rem] items-center justify-center rounded-full bg-brand-pink px-1.5 text-xs font-semibold text-white">{cartCount}</span>
            )}
          </Link>
        </div>

        <button
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 lg:hidden"
          onClick={() => setOpen((value) => !value)}
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          {open ? <FiX /> : <FiMenu />}
        </button>
      </div>

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
                <Link to="/wishlist" className="relative flex-1 rounded-full border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700">
                  Wishlist
                  {wishlistCount > 0 && <span className="absolute right-3 top-0 inline-flex h-5 min-w-[1rem] items-center justify-center rounded-full bg-red-500 px-1 text-xs font-semibold text-white">{wishlistCount}</span>}
                </Link>
                <button type="button" onClick={() => setProfileOpen((value) => !value)} className={`relative flex-1 rounded-full px-4 py-3 text-sm font-semibold ${user ? 'border border-emerald-200 bg-emerald-50 text-emerald-700' : 'border border-slate-200 bg-white text-slate-700'}`}>
                  {isAdminRole ? 'Account' : 'Profile'}
                  {user && <span className="absolute right-3 top-0 inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" aria-hidden="true" />}
                </button>
                <Link to="/cart" className="relative flex-1 rounded-full px-4 py-3 text-sm font-semibold text-white" style={{ backgroundColor: '#1F2937' }}>
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
