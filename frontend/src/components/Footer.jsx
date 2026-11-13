import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FiArrowRight,
  FiCheckCircle,
  FiHeart,
  FiMail,
  FiPackage,
  FiRefreshCw,
  FiShield,
  FiTruck,
} from 'react-icons/fi';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) return;
    setSubscribed(true);
    setEmail('');
    setTimeout(() => setSubscribed(false), 5000);
  };

  return (
    <footer className="mt-20 border-t border-slate-200 bg-slate-900 text-white font-sans">
      {/* Brand Perks Strip */}
      <div className="border-b border-slate-800 bg-slate-950/60 py-8 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <FiTruck className="text-xl" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-white">Express Delivery</h4>
              <p className="text-[11px] text-slate-400">Free shipping on orders &gt; ₹999</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <FiShield className="text-xl" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-white">Cash on Delivery</h4>
              <p className="text-[11px] text-slate-400">Zero-risk doorstep payment</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <FiPackage className="text-xl" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-white">100% Combed Cotton</h4>
              <p className="text-[11px] text-slate-400">Heavyweight 240+ GSM fabric</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <FiRefreshCw className="text-xl" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-white">7-Day Easy Returns</h4>
              <p className="text-[11px] text-slate-400">Automated RMA replacement</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Navigation & Newsletter */}
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 font-extrabold text-white text-base shadow-md shadow-indigo-500/30">
                TL
              </div>
              <span className="text-xl font-black tracking-tight text-white">
                Thread<span className="text-indigo-400">Lab</span>
              </span>
            </div>
            <p className="max-w-sm text-xs leading-relaxed text-slate-400">
              ThreadLab is an independent custom streetwear studio crafting museum-grade direct-to-garment tees, oversized silhouettes, and on-demand custom creator prints across India.
            </p>
            <div className="pt-2 flex items-center gap-3 text-xs text-slate-400">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 font-medium">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                COD & Delivery Active Pan-India
              </span>
            </div>
          </div>

          {/* Quick Links: Shop */}
          <div className="space-y-3">
            <h5 className="text-xs font-bold uppercase tracking-widest text-slate-300">Shop Catalog</h5>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <Link to="/shop" className="hover:text-white transition">All T-Shirts</Link>
              </li>
              <li>
                <Link to="/shop" className="hover:text-white transition">Oversized Fits</Link>
              </li>
              <li>
                <Link to="/shop" className="hover:text-white transition">Graphic Artwork Tees</Link>
              </li>
              <li>
                <Link to="/custom-print" className="hover:text-white transition">Custom Print Studio</Link>
              </li>
              <li>
                <Link to="/reviews" className="hover:text-white transition">Customer Reviews</Link>
              </li>
            </ul>
          </div>

          {/* Quick Links: Support */}
          <div className="space-y-3">
            <h5 className="text-xs font-bold uppercase tracking-widest text-slate-300">Customer Support</h5>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <Link to="/contact" className="hover:text-white transition">Contact Us &amp; FAQs</Link>
              </li>
              <li>
                <Link to="/profile?tab=orders" className="hover:text-white transition">Track Your Order</Link>
              </li>
              <li>
                <Link to="/profile?tab=addresses" className="hover:text-white transition">Delivery Addresses</Link>
              </li>
              <li>
                <Link to="/wishlist" className="hover:text-white transition">Saved Wishlist</Link>
              </li>
              <li>
                <Link to="/cart" className="hover:text-white transition">Shopping Cart</Link>
              </li>
            </ul>
          </div>

          {/* Newsletter Box */}
          <div className="space-y-3">
            <h5 className="text-xs font-bold uppercase tracking-widest text-slate-300">Stay in the Loop</h5>
            <p className="text-xs text-slate-400">
              Subscribe for exclusive secret drop announcements and seasonal coupon codes.
            </p>
            {subscribed ? (
              <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-3 text-xs font-semibold text-emerald-400">
                <FiCheckCircle className="text-base shrink-0" />
                <span>You're subscribed! Check your inbox soon.</span>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="space-y-2">
                <div className="relative">
                  <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full rounded-xl border border-slate-700 bg-slate-800/80 pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-xs font-bold text-white transition shadow-md shadow-indigo-600/30 cursor-pointer"
                >
                  <span>Subscribe</span>
                  <FiArrowRight className="text-xs" />
                </button>
              </form>
            )}
            <p className="text-[10px] text-slate-500">We respect your inbox. Unsubscribe anytime.</p>
          </div>
        </div>
      </div>

      {/* Bottom Legal / Copyright Bar */}
      <div className="border-t border-slate-800 bg-slate-950 py-6 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} ThreadLab Custom Wear. All rights reserved.</p>
          <div className="flex items-center gap-4 text-[11px]">
            <span className="flex items-center gap-1 text-slate-400">
              <FiShield className="text-emerald-400" /> 256-bit SSL Secured
            </span>
            <span className="text-slate-600">&bull;</span>
            <span>COD Available</span>
            <span className="text-slate-600">&bull;</span>
            <span>GST Verified Invoices</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
