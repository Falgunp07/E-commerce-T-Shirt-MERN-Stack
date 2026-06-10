import { Link } from 'react-router-dom';

const reviews = [
  {
    name: 'Aarav',
    quote: 'Print quality was clean and the size fit exactly how I expected.',
  },
  {
    name: 'Ishita',
    quote: 'The COD checkout made it easy to place the order quickly.',
  },
  {
    name: 'Kabir',
    quote: 'Loved the oversized tee and the material feels premium.',
  },
];

export default function Reviews() {
  return (
    <main className="bg-brand-gradient">
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-white/70 bg-white/80 p-8 shadow-[0_20px_50px_rgba(15,23,42,0.08)] backdrop-blur">
          <span className="inline-flex rounded-full bg-brand-gold/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-brand-ink">
            Reviews
          </span>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-brand-ink sm:text-5xl">What customers say</h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
            A quick look at the kind of feedback we aim for: good fit, strong print quality, and a smooth checkout experience.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {reviews.map((review) => (
              <article key={review.name} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm leading-6 text-slate-600">“{review.quote}”</p>
                <div className="mt-4 font-bold text-brand-ink">{review.name}</div>
              </article>
            ))}
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              ['4.9/5', 'Average product satisfaction'],
              ['2–4 days', 'Typical COD delivery window'],
              ['100%', 'Cotton-first comfort focus'],
            ].map(([value, label]) => (
              <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm text-center">
                <div className="text-2xl font-black text-brand-ink">{value}</div>
                <div className="mt-1 text-sm text-slate-600">{label}</div>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/shop" className="rounded-full bg-black px-5 py-3 text-sm font-semibold text-white">
              Shop products
            </Link>
            <Link to="/contact" className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700">
              Contact us
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}