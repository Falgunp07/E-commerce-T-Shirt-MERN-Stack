import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function Contact() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    subject: 'Bulk Custom Quote',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [referenceId, setReferenceId] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const ref = `TL-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    setReferenceId(ref);
    setSubmitted(true);
  };

  return (
    <main className="bg-brand-gradient">
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-white/70 bg-white/80 p-8 shadow-[0_20px_50px_rgba(15,23,42,0.08)] backdrop-blur">
          <span className="inline-flex rounded-full bg-brand-purple/15 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-brand-ink">
            Contact & Support
          </span>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-brand-ink sm:text-5xl">Get in touch</h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
            Need a bulk quote, corporate order, or custom design guidance? Reach out and our merchandising specialists will help you plan your collection.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              ['Direct Helpline', '+91 98765 43210'],
              ['Official Support', 'hello@threadlab.in'],
              ['Payment Mode', 'COD available across India'],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{label}</div>
                <div className="mt-2 text-lg font-bold text-brand-ink">{value}</div>
              </div>
            ))}
          </div>

          {/* Interactive Contact & Quote Form */}
          <div className="mt-10 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
            <h2 className="text-2xl font-black text-brand-ink">Send an Inquiry or Quote Request</h2>
            <p className="mt-1 text-sm text-slate-500">We typically reply within 24 hours with proofs, timelines, and bulk discounts.</p>

            {submitted ? (
              <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mb-3">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-emerald-900">Inquiry Received Successfully!</h3>
                <p className="text-sm text-emerald-700 mt-1">
                  Thank you, <strong>{form.name}</strong>. Reference ID:{' '}
                  <span className="font-mono font-bold bg-white px-2 py-0.5 rounded border border-emerald-300">
                    {referenceId}
                  </span>
                </p>
                <p className="text-xs text-emerald-600 mt-2">Our production team will contact you at {form.email}.</p>
                <button
                  onClick={() => {
                    setSubmitted(false);
                    setForm({ name: '', email: '', phone: '', subject: 'Bulk Custom Quote', message: '' });
                  }}
                  className="mt-4 px-5 py-2 rounded-full bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-500 transition cursor-pointer"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">Your Name</label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="mt-1 block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-brand-ink focus:bg-white"
                      placeholder="Aarav Sharma"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">Email Address</label>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="mt-1 block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-brand-ink focus:bg-white"
                      placeholder="aarav@example.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">Phone (Optional for WhatsApp callback)</label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="mt-1 block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-brand-ink focus:bg-white"
                      placeholder="+91 98765 43210"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">Inquiry Type</label>
                    <select
                      value={form.subject}
                      onChange={(e) => setForm({ ...form, subject: e.target.value })}
                      className="mt-1 block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-brand-ink focus:bg-white"
                    >
                      <option value="Bulk Custom Quote">Bulk Custom Quote (10+ tees)</option>
                      <option value="Design & Print Support">Design & Artwork Assistance</option>
                      <option value="Order Tracking">Order & COD Delivery Support</option>
                      <option value="Partnership">Brand Collaboration / Creator Drop</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">Message / Requirement Details</label>
                  <textarea
                    required
                    rows="4"
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    className="mt-1 block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-brand-ink focus:bg-white"
                    placeholder="Describe your design, quantities, sizes, or questions..."
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className="rounded-full bg-black px-7 py-3.5 text-sm font-semibold text-white shadow-md hover:bg-slate-800 transition cursor-pointer"
                >
                  Submit Inquiry
                </button>
              </form>
            )}
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/custom-print" className="rounded-full bg-black px-5 py-3 text-sm font-semibold text-white">
              Interactive Custom Studio
            </Link>
            <Link to="/shop" className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700">
              View Shop
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
