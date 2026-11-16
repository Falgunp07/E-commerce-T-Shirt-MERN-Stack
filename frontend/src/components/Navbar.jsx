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
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const profileMenuRef = useRef(null);
  const searchInputRef = useRef(null);
  const { cart } = useCart();
  const { wishlist } = useWishlist();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const cartCount = cart.reduce((s, p) => s + (p.qty || 0), 0);
  const wishlistCount = wishlist.length;
  const isAdminRole = Boolean(user && ['admin', 'catalog_manager', 'logistics_manager'].includes(user.role));

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
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

  function handleProfileLogout() {
    logout();
    setProfileOpen(false);
    setOpen(false);
    navigate('/login', { replace: true });
  }

  function handleSearchSubmit(e) {
    e.preventDefault();
    const q = searchQuery.trim();
    if (q) {
      navigate(`/shop?q=${encodeURIComponent(q)}`);
      setSearchOpen(false);
      setOpen(false);
    }
  }

  return (
    <header className="sticky top-0 z-50 border-b border-white/60 bg-white/95 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center" aria-label="Rudraksh Enterprise Home">
          <img
            src="/logo.png"
            alt="Logo"
            className="h-12 w-12 sm:h-14 sm:w-14 object-contain transition-transform duration-200 hover:scale-105"
          />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-7 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              className="text-sm font-semibold text-slate-700 transition-colors duration-200 hover:text-brand-pink"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Desktop Actions */}
        <div className="hidden items-center gap-3 md:flex">
          {/* Search Toggle */}
          <button
            type="button"
            onClick={() => setSearchOpen((prev) => !prev)}
            className={`inline-flex h-11 w-11 items-center justify-center rounded-full border transition hover:-translate-y-0.5 cursor-pointer ${
              searchOpen
                ? 'border-black bg-black text-white'
                : 'border-slate-200 bg-white text-slate-700 hover:border-brand-pink hover:text-brand-pink'
            }`}
            aria-label="Toggle Search"
            title="Search Products"
          >
            {searchOpen ? <FiX className="text-base" /> : <FiSearch className="text-base" />}
          </button>

          {/* Wishlist */}
          <Link
            to="/wishlist"
            className="relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:-translate-y-0.5 hover:border-brand-pink hover:text-brand-pink"
            aria-label="Wishlist"
            title="Saved Wishlist"
          >
            <FiHeart className="text-base" />
            {wishlistCount > 0 && (
              <span className="absolute -right-1.5 -top-1.5 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-bold text-white shadow-xs">
                {wishlistCount}
              </span>
            )}
          </Link>

          {/* Profile Dropdown */}
          <div className="relative" ref={profileMenuRef}>
            <button
              type="button"
              className={`relative inline-flex h-11 w-11 items-center justify-center rounded-full border transition hover:-translate-y-0.5 overflow-hidden cursor-pointer ${
                user
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-300 hover:text-emerald-800'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-brand-pink hover:text-brand-pink'
              }`}
              aria-label={user ? 'Account menu' : 'Login menu'}
              aria-expanded={profileOpen}
              onClick={() => setProfileOpen((value) => !value)}
            >
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} className="h-full w-full rounded-full object-cover" />
              ) : (
                <FiUser className="text-base" />
              )}
              {user && <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" aria-hidden="true" />}
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
                    <div className="mt-1 text-xs text-slate-500 truncate">{user ? user.email : 'Sign in to view your profile and orders'}</div>
                    {user && !isAdminRole && (
                      <div className="mt-2 inline-flex rounded-full bg-slate-900 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-white">
                        Customer account
                      </div>
                    )}
                  </div>

                  {user ? (
                    isAdminRole ? (
                      <div className="mt-2 space-y-1">
                        <Link to="/admin/dashboard" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">
                          <FiSettings />
                          Dashboard
                        </Link>
                        <Link to="/admin/catalog" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">
                          <FiPackage />
                          Catalog
                        </Link>
                        <Link to="/admin/orders" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">
                          <FiPackage />
                          Orders
                        </Link>
                        <Link to="/admin/customers" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">
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
                        <Link to="/profile?tab=overview" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">
                          <FiUser />
                          Profile
                        </Link>
                        <Link to="/profile?tab=orders" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">
                          <FiPackage />
                          Orders
                        </Link>
                        <Link to="/profile?tab=addresses" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">
                          <FiSettings />
                          Addresses
                        </Link>
                        <Link to="/wishlist" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">
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
                      <Link to="/login" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">
                        <FiUser />
                        Sign in
                      </Link>
                      <Link to="/register" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">
                        <FiUser />
                        Create account
                      </Link>
                    </div>
                  )}
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>

          {/* Cart Button */}
          <Link
            to="/cart"
            className="relative inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-bold text-white transition hover:opacity-90 shadow-sm"
            style={{ backgroundColor: '#1F2937' }}
          >
            <FiShoppingBag className="text-base" />
            <span>Cart</span>
            {cartCount > 0 && (
              <span className="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-brand-pink px-1 text-xs font-bold text-white">
                {cartCount}
              </span>
            )}
          </Link>
        </div>

        {/* Mobile Hamburger & Cart Button */}
        <div className="flex items-center gap-2 md:hidden">
          <Link
            to="/cart"
            className="relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-800"
            aria-label="Cart"
          >
            <FiShoppingBag className="text-base" />
            {cartCount > 0 && (
              <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-brand-pink px-1 text-[11px] font-bold text-white">
                {cartCount}
              </span>
            )}
          </Link>
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 cursor-pointer"
            onClick={() => setOpen((value) => !value)}
            aria-label="Toggle menu"
            aria-expanded={open}
          >
            {open ? <FiX className="text-xl" /> : <FiMenu className="text-xl" />}
          </button>
        </div>
      </div>

      {/* Expandable Desktop Search Bar */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-slate-200 bg-slate-50/90 px-4 py-3 shadow-inner"
          >
            <form onSubmit={handleSearchSubmit} className="mx-auto flex max-w-3xl items-center gap-3">
              <div className="relative flex-1">
                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search t-shirts by name, style, artwork, or color..."
                  className="w-full rounded-full border border-slate-300 bg-white pl-11 pr-4 py-2.5 text-sm font-medium text-slate-800 placeholder-slate-400 outline-none focus:border-brand-ink focus:ring-2 focus:ring-brand-ink/10"
                />
              </div>
              <button
                type="submit"
                className="rounded-full bg-black px-6 py-2.5 text-xs font-bold text-white transition hover:bg-slate-800 cursor-pointer shadow-sm"
              >
                Search
              </button>
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="rounded-full p-2 text-slate-500 hover:bg-slate-200 hover:text-slate-800 cursor-pointer transition"
                aria-label="Close search"
              >
                <FiX className="text-lg" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="border-t border-slate-200 bg-white px-4 py-5 shadow-xl md:hidden max-h-[85vh] overflow-y-auto"
          >
            <div className="mx-auto flex max-w-7xl flex-col gap-4">
              {/* Mobile Search Form */}
              <form onSubmit={handleSearchSubmit} className="flex gap-2">
                <div className="relative flex-1">
                  <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-base" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search drops & t-shirts..."
                    className="w-full rounded-full border border-slate-200 bg-slate-50 pl-10 pr-3 py-2.5 text-xs text-slate-900 outline-none focus:border-brand-ink focus:bg-white"
                  />
                </div>
                <button
                  type="submit"
                  className="rounded-full bg-black px-4 py-2.5 text-xs font-bold text-white cursor-pointer"
                >
                  Go
                </button>
              </form>

              {/* Navigation Items */}
              <div className="grid grid-cols-2 gap-2">
                {navItems.map((item) => (
                  <Link
                    key={item.label}
                    to={item.to}
                    className="rounded-2xl bg-slate-50 px-4 py-3 text-xs font-bold text-slate-800 hover:bg-slate-100 transition"
                    onClick={() => setOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))}
                <Link
                  to="/wishlist"
                  className="rounded-2xl bg-slate-50 px-4 py-3 text-xs font-bold text-slate-800 hover:bg-slate-100 transition flex items-center justify-between"
                  onClick={() => setOpen(false)}
                >
                  <span>Wishlist</span>
                  {wishlistCount > 0 && (
                    <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                      {wishlistCount}
                    </span>
                  )}
                </Link>
              </div>

              {/* Account Section in Mobile Menu */}
              <div className="border-t border-slate-100 pt-3">
                {user ? (
                  <div className="rounded-2xl bg-slate-50 p-3.5 space-y-2">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                      <div>
                        <div className="text-xs font-bold text-slate-900">{user.name}</div>
                        <div className="text-[11px] text-slate-500 truncate">{user.email}</div>
                      </div>
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                        {user.role}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1 text-xs font-semibold">
                      {isAdminRole ? (
                        <>
                          <Link to="/admin/dashboard" onClick={() => setOpen(false)} className="rounded-xl bg-white p-2 text-center text-slate-700 shadow-xs border border-slate-200">
                            Dashboard
                          </Link>
                          <Link to="/admin/orders" onClick={() => setOpen(false)} className="rounded-xl bg-white p-2 text-center text-slate-700 shadow-xs border border-slate-200">
                            Orders
                          </Link>
                        </>
                      ) : (
                        <>
                          <Link to="/profile?tab=orders" onClick={() => setOpen(false)} className="rounded-xl bg-white p-2 text-center text-slate-700 shadow-xs border border-slate-200">
                            My Orders
                          </Link>
                          <Link to="/profile?tab=addresses" onClick={() => setOpen(false)} className="rounded-xl bg-white p-2 text-center text-slate-700 shadow-xs border border-slate-200">
                            Addresses
                          </Link>
                        </>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={handleProfileLogout}
                      className="w-full mt-2 rounded-xl border border-red-200 bg-red-50 py-2 text-xs font-bold text-red-600 cursor-pointer text-center"
                    >
                      Log Out
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Link
                      to="/login"
                      onClick={() => setOpen(false)}
                      className="flex-1 rounded-full border border-slate-300 bg-white py-2.5 text-center text-xs font-bold text-slate-800 shadow-xs"
                    >
                      Sign In
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setOpen(false)}
                      className="flex-1 rounded-full bg-black py-2.5 text-center text-xs font-bold text-white shadow-xs"
                    >
                      Register
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}

export default Navbar;
