import { Link } from 'react-router-dom';

export default function Contact() {
  return (
    <main className="bg-brand-gradient">
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-white/70 bg-white/80 p-8 shadow-[0_20px_50px_rgba(15,23,42,0.08)] backdrop-blur">
          <span className="inline-flex rounded-full bg-brand-purple/15 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-brand-ink">
            Contact
          </span>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-brand-ink sm:text-5xl">Get in touch</h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
            Need a quote, bulk order, or custom design help? Reach out and we’ll help you plan the right print setup.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              ['Phone', '+91 98765 43210'],
              ['Email', 'hello@threadlab.in'],
              ['Location', 'Local delivery and COD support'],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{label}</div>
                <div className="mt-2 text-lg font-bold text-brand-ink">{value}</div>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/custom-print" className="rounded-full bg-black px-5 py-3 text-sm font-semibold text-white">
              Custom print
            </Link>
            <Link to="/shop" className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700">
              View shop
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}