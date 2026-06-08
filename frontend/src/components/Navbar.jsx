import { useState } from 'react';
import { useCart } from '../context/CartContext';
import { Link } from 'react-router-dom';
import { FiHeart, FiMenu, FiSearch, FiShoppingBag, FiX } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

const navItems = [
  { label: 'Shop', href: '#shop' },
  { label: 'Custom Print', href: '#custom-print' },
  { label: 'Drops', href: '#drops' },
  { label: 'Reviews', href: '#reviews' },
  { label: 'Contact', href: '#contact' },
];

function Navbar() {
  const [open, setOpen] = useState(false);
  const { cart } = useCart();
  const cartCount = cart.reduce((s, p) => s + (p.qty || 0), 0);

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
            <a
              key={item.label}
              href={item.href}
              className="text-sm font-medium text-slate-700 transition-colors duration-200 hover:text-brand-pink"
            >
              {item.label}
            </a>
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
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:-translate-y-0.5 hover:border-brand-pink hover:text-brand-pink"
            aria-label="Wishlist"
          >
            <FiHeart />
          </button>
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
                <a
                  key={item.label}
                  href={item.href}
                  className="rounded-2xl bg-brand-mist px-4 py-3 text-sm font-semibold text-brand-ink"
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </a>
              ))}
              <div className="flex gap-3 pt-2">
                <button type="button" className="flex-1 rounded-full border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700">
                  Search
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
