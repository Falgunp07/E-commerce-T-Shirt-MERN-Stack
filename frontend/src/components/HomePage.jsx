import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FiArrowRight } from 'react-icons/fi';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { FiHeart } from 'react-icons/fi';
import { Link, useNavigate } from 'react-router-dom';

// Featured will be loaded from backend (top 3 products)

function formatPrice(v) {
	return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v);
}

export default function HomePage() {
	const [loading, setLoading] = useState(true);
	const [featured, setFeatured] = useState([]);
	const { cart, addItem, updateItemQty, removeItem } = useCart();
	const { wishlist, toggleItem } = useWishlist();
	const navigate = useNavigate();

	useEffect(() => {
		const t = setTimeout(() => setLoading(false), 700);
		return () => clearTimeout(t);
	}, []);

	useEffect(() => {
		let mounted = true;
		fetch('http://localhost:5000/api/products')
			.then((r) => r.json())
			.then((data) => {
				if (!mounted) return;
				if (data && data.success && Array.isArray(data.products)) setFeatured(data.products.slice(0, 3));
			})
			.catch(() => {});
		return () => {
			mounted = false;
		};
	}, []);

	function isWishlisted(productId) {
		return wishlist.some((item) => item.id === productId);
	}

	function getCartItem(productId) {
		return cart.find((item) => item.id === productId && (item.size ?? null) === null);
	}

	function openProduct(productId) {
		navigate(`/product/${productId}`);
	}

	function handleProductCardClick(e, productId) {
		if (e.target.closest('button, a, input, select, textarea')) return;
		openProduct(productId);
	}

	function handleProductCardKeyDown(e, productId) {
		if (e.target !== e.currentTarget) return;
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			openProduct(productId);
		}
	}

	return (
		<main className="w-full">
			<section className="w-full bg-black py-3 text-white">
				<div className="mx-auto flex max-w-7xl flex-col items-center justify-center gap-2 px-4 text-center sm:flex-row sm:gap-4 sm:px-6 lg:px-8">
					<span className="text-sm font-semibold uppercase tracking-[0.28em] text-green-400">Coupon Code</span>
					<p className="text-sm font-medium text-white/90">
						Use <span className="font-bold text-green-400">THREAD50</span> and get <span className="font-extrabold text-red-500">50% OFF</span> on your first custom order.
					</p>
				</div>
			</section>

			{/* Hero — full-bleed background, centered content */}
			<section className="w-full bg-linear-to-br from-white via-[#fff7f8] to-[#f4f5ff] py-12">
				<div className="mx-auto max-w-7xl p-8 lg:grid lg:grid-cols-2 lg:gap-8">
					<motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }} className="flex flex-col justify-center">
						<span className="inline-flex items-center rounded-full bg-brand-gold/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-brand-ink">New Drop</span>
						<h1 className="mt-4 text-4xl font-extrabold text-brand-ink sm:text-5xl">Premium Custom Tees — Print with precision</h1>
						<p className="mt-4 max-w-xl text-base text-slate-700">High-quality materials, vibrant prints, and limited drops — built for collectors and creators. Design your own or shop our curated collections.</p>
						<div className="mt-6 flex gap-3">
							<Link to="/shop" style={{ backgroundColor: '#1F2937' }} className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white shadow-xl hover:brightness-90 transform transition">Shop Collection <FiArrowRight /></Link>
							<Link to="/custom-print" className="inline-flex items-center gap-2 rounded-full border border-brand-purple/30 bg-white/80 px-5 py-3 text-sm font-semibold text-brand-purple">Design Yours</Link>
						</div>
					</motion.div>

					<motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6 }} className="relative flex items-center justify-center mt-8 lg:mt-0">
						<div className="absolute -left-8 -top-8 h-36 w-36 rounded-full bg-brand-pink/20 blur-3xl" />
						<div className="absolute -right-8 -bottom-8 h-48 w-48 rounded-full bg-brand-purple/20 blur-3xl" />
						<div className="w-full overflow-hidden rounded-2xl border border-slate-100 bg-white p-2 shadow-2xl">
							<img src="https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=1200&q=80" alt="hero" className="h-80 w-full rounded-xl object-contain bg-white p-3" />
						</div>
					</motion.div>
				</div>
			</section>

			{/* Trending Drops — full-bleed container with centered grid */}
			<section id="drops" className="w-full py-10">
				<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
					<div className="flex items-baseline justify-between">
					<h2 className="text-2xl font-extrabold text-brand-ink">Trending Drops</h2>
						<Link to="/shop" className="text-sm font-medium text-brand-purple">View all</Link>
					</div>

					<div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-3">
						{loading ? (
							[1, 2, 3].map((i) => <div key={i} className="h-64 animate-pulse rounded-xl bg-slate-100" />)
						) : (
								featured.map((p) => {
									const cartItem = getCartItem(p._id);
									const qty = cartItem?.qty || 0;

									return (
										<article
											key={p._id}
											onClick={(e) => handleProductCardClick(e, p._id)}
											onKeyDown={(e) => handleProductCardKeyDown(e, p._id)}
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
													{formatPrice(p.price)}
												</div>
											</div>

											<div className="p-5">
												<div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Streetwear / Custom</div>
												<h3 className="mt-2 text-xl font-extrabold text-brand-ink">{p.title}</h3>
												<p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">{p.description}</p>

												<div className="mt-5 flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
													<div>
														<div className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">Price</div>
														<div className="text-lg font-black text-brand-ink">{formatPrice(p.price)}</div>
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
															className="inline-flex h-10 items-center justify-center rounded-full bg-black px-5 text-sm font-semibold text-white shadow transition hover:opacity-90 whitespace-nowrap"
														>
															Add to cart
														</button>
													)}
												</div>
											</div>
										</article>
									);
								})
						)}
					</div>
				</div>
			</section>

			{/* Custom Bulk Orders */}
			<section className="w-full py-10 bg-slate-50">
				<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
					<div className="rounded-2xl bg-white p-6 shadow-sm flex items-center justify-between gap-4">
						<div>
							<h3 className="text-lg font-extrabold">Custom Bulk Orders</h3>
							<p className="mt-1 text-sm text-slate-600">For events, colleges, and teams — get a tailor-made quote.</p>
						</div>
						<a href="#bulk" className="rounded-full bg-brand-ink px-5 py-3 text-sm font-semibold text-white">Request Quote</a>
					</div>
				</div>
			</section>
		</main>
	);
}
