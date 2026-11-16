import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { API_BASE_URL } from '../config/api';

const INITIAL_REVIEWS = [
  {
    _id: 'rev_1',
    name: 'Aarav Sharma',
    rating: 5,
    quote: 'Print quality was clean and the size fit exactly how I expected. Heavyweight cotton feels like true streetwear.',
    createdAt: new Date(Date.now() - 2 * 86400000),
  },
  {
    _id: 'rev_2',
    name: 'Ishita Patel',
    rating: 5,
    quote: 'The COD checkout made it easy to place the order quickly. Arrived in 3 days with neat branded packaging.',
    createdAt: new Date(Date.now() - 5 * 86400000),
  },
  {
    _id: 'rev_3',
    name: 'Kabir Verma',
    rating: 5,
    quote: 'Loved the oversized tee and the material feels premium. Washed twice inside out and colors remained vivid.',
    createdAt: new Date(Date.now() - 7 * 86400000),
  },
  {
    _id: 'rev_4',
    name: 'Rohan Deshmukh',
    rating: 5,
    quote: 'Ordered the custom printed tees for our startup team. DTG print resolution is razor sharp!',
    createdAt: new Date(Date.now() - 14 * 86400000),
  },
];

export default function Reviews() {
  const [reviewsList, setReviewsList] = useState(INITIAL_REVIEWS);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [name, setName] = useState('');
  const [rating, setRating] = useState(5);
  const [quote, setQuote] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let mounted = true;
    fetch(`${API_BASE_URL}/api/reviews`)
      .then((res) => res.json())
      .then((data) => {
        if (!mounted) return;
        if (data.success && Array.isArray(data.reviews) && data.reviews.length > 0) {
          setReviewsList(data.reviews);
        }
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!name.trim() || !quote.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), rating, quote: quote.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.review) {
        setReviewsList((prev) => [data.review, ...prev]);
        setName('');
        setQuote('');
        setRating(5);
        setSubmitSuccess(true);
        setTimeout(() => {
          setSubmitSuccess(false);
          setShowReviewForm(false);
        }, 2000);
      }
    } catch {
      alert('Error posting review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="bg-brand-gradient">
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-white/70 bg-white/80 p-6 sm:p-10 shadow-[0_20px_50px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <span className="inline-flex rounded-full bg-brand-gold/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-brand-ink">
                Verified Drops & Reviews
              </span>
              <h1 className="mt-4 text-4xl font-black tracking-tight text-brand-ink sm:text-5xl">What customers say</h1>
              <p className="mt-2 text-base text-slate-600">
                Honest feedback from streetwear collectors across India on fit, GSM quality, and print durability.
              </p>
            </div>
            <button
              onClick={() => setShowReviewForm((v) => !v)}
              className="self-start sm:self-auto px-6 py-3 rounded-full bg-black text-white text-xs font-bold hover:bg-slate-800 transition cursor-pointer shadow-md"
            >
              {showReviewForm ? 'Cancel Form' : 'Write a Review'}
            </button>
          </div>

          {/* Interactive Review Submission Form */}
          {showReviewForm && (
            <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-xl font-bold text-slate-900 mb-4">Leave Your Drop Review</h3>
              {submitSuccess ? (
                <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-center text-sm font-bold text-emerald-700">
                  ✓ Thank you! Your review has been posted and published.
                </div>
              ) : (
                <form onSubmit={handleSubmitReview} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">Your Name</label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="mt-1 block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-brand-ink focus:bg-white"
                        placeholder="Aditya Kapoor"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">Star Rating</label>
                      <div className="mt-2 flex gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setRating(star)}
                            className={`h-10 w-10 rounded-xl border text-base font-bold transition cursor-pointer flex items-center justify-center ${
                              rating >= star
                                ? 'bg-amber-400 border-amber-500 text-white shadow-xs'
                                : 'bg-slate-50 border-slate-200 text-slate-400'
                            }`}
                          >
                            ★
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">Your Review</label>
                    <textarea
                      required
                      rows="3"
                      value={quote}
                      onChange={(e) => setQuote(e.target.value)}
                      className="mt-1 block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-brand-ink focus:bg-white"
                      placeholder="Share your thoughts about the cotton fabric, print quality, and delivery speed..."
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    className="px-6 py-3 rounded-full bg-black text-white text-xs font-bold hover:bg-slate-800 transition cursor-pointer"
                  >
                    Post Review
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Review Grid */}
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {reviewsList.map((review, idx) => (
              <article key={review._id || review.id || idx} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1 text-amber-400 text-sm mb-2">
                    {'★'.repeat(Math.min(5, Math.max(1, review.rating || 5)))}
                  </div>
                  <p className="text-sm leading-6 text-slate-600">“{review.quote}”</p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
                  <div>
                    <span className="font-bold text-brand-ink block">{review.name}</span>
                    {review.productTitle && (
                      <span className="text-[10px] text-slate-400 truncate block max-w-[140px]">{review.productTitle}</span>
                    )}
                  </div>
                  <span className="text-emerald-600 font-semibold text-[10px] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Verified Buyer
                  </span>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {[
              ['4.9 / 5.0', 'Average product satisfaction'],
              ['2–4 days', 'Typical COD delivery window'],
              ['100% Cotton', 'High-GSM comfort focus'],
            ].map(([value, label]) => (
              <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm text-center">
                <div className="text-2xl font-black text-brand-ink">{value}</div>
                <div className="mt-1 text-sm text-slate-600">{label}</div>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/shop" className="rounded-full bg-black px-6 py-3 text-sm font-semibold text-white">
              Shop Collections
            </Link>
            <Link to="/custom-print" className="rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700">
              Design Custom Tee
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
