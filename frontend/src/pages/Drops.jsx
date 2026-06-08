import { Link } from 'react-router-dom';

const drops = [
  {
    title: 'Midnight Manga Oversized Tee',
    note: 'High-contrast art drop with oversized streetwear fit.',
  },
  {
    title: 'Neon Couple Print Set',
    note: 'Matching set built for photoshoots and gifting.',
  },
  {
    title: 'Street Script Hoodie',
    note: 'Heavyweight hoodie with soft fleece and embroidered look.',
  },
];

export default function Drops() {
  return (
    <main className="bg-brand-gradient">
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-white/70 bg-white/80 p-8 shadow-[0_20px_50px_rgba(15,23,42,0.08)] backdrop-blur">
          <span className="inline-flex rounded-full bg-brand-pink/15 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-brand-ink">
            Drops
          </span>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-brand-ink sm:text-5xl">Latest product drops</h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
            Our latest collection pieces are built for limited release. Explore the current drop lineup or head back to the shop for the full catalog.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {drops.map((drop) => (
              <article key={drop.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-lg font-bold text-brand-ink">{drop.title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">{drop.note}</p>
              </article>
            ))}
          </div>

          <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-brand-ink">Drop calendar</h2>
            <div className="mt-3 grid gap-3 md:grid-cols-3 text-sm leading-6 text-slate-600">
              <div>
                <div className="font-semibold text-brand-ink">Monday</div>
                Fresh product preview and price updates.
              </div>
              <div>
                <div className="font-semibold text-brand-ink">Wednesday</div>
                New color options and size restocks.
              </div>
              <div>
                <div className="font-semibold text-brand-ink">Friday</div>
                Featured drop highlights and cart-ready listings.
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/shop" className="rounded-full bg-black px-5 py-3 text-sm font-semibold text-white">
              Shop now
            </Link>
            <Link to="/custom-print" className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700">
              Custom print
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}