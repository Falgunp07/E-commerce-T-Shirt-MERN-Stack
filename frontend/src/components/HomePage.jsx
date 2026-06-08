import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FiArrowRight, FiStar } from 'react-icons/fi';
import { useCart } from '../context/CartContext';
import { Link, useNavigate } from 'react-router-dom';

// Featured will be loaded from backend (top 3 products)

function formatPrice(v) {
	return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v);
}

export default function HomePage() {
	const [loading, setLoading] = useState(true);
	const [featured, setFeatured] = useState([]);
	const { cart, addItem, updateItemQty, removeItem } = useCart();
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
								featured.map((p) => (
									<article key={p._id} onClick={() => navigate(`/product/${p._id}`)} className="relative overflow-hidden rounded-xl border border-slate-100 bg-white shadow cursor-pointer">
										<img src={p.img} alt={p.title} className="h-56 w-full rounded-t-xl object-contain bg-white p-3" />
										<div className="p-4">
											<h3 className="text-base font-semibold text-brand-ink">{p.title}</h3>
											<div className="mt-2 flex items-center justify-between">
												<div className="flex items-center gap-2 text-sm text-slate-600"><FiStar className="text-amber-400" /> 4.8</div>
												<div className="text-lg font-extrabold">{formatPrice(p.price)}</div>
											</div>
											<div className="mt-3">
												{/* determine qty from cart (no size variant) */}
												{(() => {
													const item = cart.find((c) => c.id === p._id && !c.size);
													const qty = item?.qty || 0;
													if (qty === 0) {
														return (
															<div className="flex justify-center">
																<button
																	onClick={(e) => {
																		e.stopPropagation();
																		addItem({ id: p._id, title: p.title, price: p.price });
																	}}
																	className="w-full inline-flex items-center justify-center h-10 rounded-full bg-black px-4 text-sm font-semibold text-white shadow-sm whitespace-nowrap"
																>
																	Add to cart
																</button>
															</div>
														);
													}

													return (
														<div className="flex items-center justify-center gap-3">
															<button
																onClick={(e) => {
																	e.stopPropagation();
																	const newQty = qty - 1;
																	if (newQty <= 0) removeItem(p._id);
																	else updateItemQty(p._id, undefined, newQty);
																}}
																className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-lg font-bold text-brand-ink"
															>
																-
															</button>
															<div className="text-sm font-semibold">{qty}</div>
															<button
																onClick={(e) => {
																	e.stopPropagation();
																	addItem({ id: p._id, title: p.title, price: p.price });
																}}
																className="flex h-9 w-9 items-center justify-center rounded-full bg-black text-lg font-bold text-white"
															>
																+
															</button>
														</div>
													);
												})()}
											</div>
										</div>
									</article>
							))
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
