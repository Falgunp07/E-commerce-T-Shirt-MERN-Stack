import { Link } from 'react-router-dom';

export default function CustomPrint() {
  return (
    <main className="bg-brand-gradient">
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-white/70 bg-white/80 p-8 shadow-[0_20px_50px_rgba(15,23,42,0.08)] backdrop-blur">
          <span className="inline-flex rounded-full bg-brand-gold/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-brand-ink">
            Custom Print
          </span>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-brand-ink sm:text-5xl">Design your own custom T-shirt</h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
            Tell us what you want printed, choose your garment, and we’ll help you turn it into a clean finished piece. Perfect for brands, events, colleges, and creator merch.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              ['Choose style', 'Pick tees, hoodies, or matching sets.'],
              ['Send design', 'Share your artwork, logo, or idea.'],
              ['Confirm order', 'Review details and place COD order.'],
            ].map(([title, text]) => (
              <div key={title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-lg font-bold text-brand-ink">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-bold text-brand-ink">What we need from you</h2>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
                <li>• Shirt size and color preference</li>
                <li>• Design file or clear reference image</li>
                <li>• Quantity and delivery timeline</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-bold text-brand-ink">Printing notes</h2>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
                <li>• Best results with clean PNG or SVG artwork</li>
                <li>• We can help adjust placement and sizing</li>
                <li>• COD available after design confirmation</li>
              </ul>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/contact" className="rounded-full bg-black px-5 py-3 text-sm font-semibold text-white">
              Talk to us
            </Link>
            <Link to="/shop" className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700">
              Browse shop
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}