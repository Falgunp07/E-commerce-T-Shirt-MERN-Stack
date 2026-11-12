import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';

const TEE_COLORS = [
  { name: 'Jet Black', hex: '#111827', img: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=800&q=80' },
  { name: 'Cloud White', hex: '#F9FAFB', img: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?auto=format&fit=crop&w=800&q=80' },
  { name: 'Charcoal Grey', hex: '#374151', img: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=800&q=80' },
  { name: 'Midnight Navy', hex: '#1E293B', img: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=800&q=80' },
];

export default function CustomPrint() {
  const navigate = useNavigate();
  const { addItem } = useCart();
  const [selectedColor, setSelectedColor] = useState(TEE_COLORS[0]);
  const [selectedSize, setSelectedSize] = useState('M');
  const [printPosition, setPrintPosition] = useState('Front Chest');
  const [customText, setCustomText] = useState('YOUR DESIGN HERE');
  const [fontStyle, setFontStyle] = useState('sans'); // 'sans', 'serif', 'mono'
  const [artworkUrl, setArtworkUrl] = useState('');
  const [addedNotice, setAddedNotice] = useState(false);

  const basePrice = 899;

  const handleAddToCart = () => {
    addItem({
      id: `custom-tee-${Date.now()}`,
      title: `Custom Print Tee (${selectedColor.name})`,
      price: basePrice,
      size: selectedSize,
      color: selectedColor.name,
      img: selectedColor.img,
      qty: 1,
      customDetails: {
        text: customText,
        position: printPosition,
      },
    });
    setAddedNotice(true);
    setTimeout(() => setAddedNotice(false), 3000);
  };

  const handleBuyNow = () => {
    handleAddToCart();
    navigate('/checkout');
  };

  return (
    <main className="bg-brand-gradient">
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-white/70 bg-white/80 p-6 sm:p-10 shadow-[0_20px_50px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="max-w-3xl">
            <span className="inline-flex rounded-full bg-brand-gold/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-brand-ink">
              Interactive Custom Studio
            </span>
            <h1 className="mt-4 text-4xl font-black tracking-tight text-brand-ink sm:text-5xl">Design your custom T-shirt</h1>
            <p className="mt-3 text-base text-slate-600">
              Customize real-time artwork, pick garment colors, and get premium heavyweight cotton tees delivered with Cash on Delivery.
            </p>
          </div>

          <div className="mt-10 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            {/* Visual Live Interactive Mockup Canvas */}
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 flex flex-col items-center justify-center relative overflow-hidden">
              <div className="relative w-full max-w-md aspect-square bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex items-center justify-center overflow-hidden">
                <img
                  src={selectedColor.img}
                  alt={selectedColor.name}
                  className="w-full h-full object-contain filter contrast-105"
                />

                {/* Simulated Custom Print Placement Overlay */}
                <div
                  className={`absolute pointer-events-none text-center px-4 py-2 rounded-lg ${
                    printPosition === 'Front Chest'
                      ? 'top-1/3'
                      : printPosition === 'Left Pocket'
                      ? 'top-1/4 left-1/4 scale-75'
                      : 'top-1/2 scale-110'
                  }`}
                  style={{
                    color: selectedColor.name === 'Cloud White' ? '#111827' : '#FFFFFF',
                    fontFamily: fontStyle === 'serif' ? 'serif' : fontStyle === 'mono' ? 'monospace' : 'sans-serif',
                  }}
                >
                  {artworkUrl ? (
                    <img src={artworkUrl} alt="custom artwork" className="h-16 w-16 object-contain mx-auto" />
                  ) : (
                    <div className="font-black text-xl sm:text-2xl tracking-widest uppercase drop-shadow-md border-2 border-dashed border-current/40 p-2 rounded">
                      {customText || 'YOUR TEXT'}
                    </div>
                  )}
                  <span className="text-[9px] uppercase tracking-widest font-mono opacity-80 block mt-1">
                    [{printPosition}]
                  </span>
                </div>
              </div>

              {/* Garment Swatches */}
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                {TEE_COLORS.map((c) => (
                  <button
                    key={c.name}
                    onClick={() => setSelectedColor(c)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold transition cursor-pointer ${
                      selectedColor.name === c.name
                        ? 'border-brand-ink bg-white shadow-sm ring-2 ring-brand-ink/20'
                        : 'border-slate-200 bg-white/70 hover:bg-white text-slate-600'
                    }`}
                  >
                    <span className="h-4 w-4 rounded-full border border-slate-300" style={{ backgroundColor: c.hex }} />
                    {c.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Customizer Controls */}
            <div className="space-y-6">
              {/* Placement & Typography Controls */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">Custom Text / Slogan</label>
                  <input
                    type="text"
                    value={customText}
                    onChange={(e) => setCustomText(e.target.value.toUpperCase())}
                    className="mt-1 block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-brand-ink focus:bg-white uppercase tracking-wider"
                    placeholder="ENTER YOUR SLOGAN OR BRAND"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">Or Artwork / Logo Image URL (PNG/SVG)</label>
                  <input
                    type="url"
                    value={artworkUrl}
                    onChange={(e) => setArtworkUrl(e.target.value)}
                    className="mt-1 block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-900 outline-none focus:border-brand-ink focus:bg-white font-mono"
                    placeholder="https://example.com/my-logo.png"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">Print Placement</label>
                    <select
                      value={printPosition}
                      onChange={(e) => setPrintPosition(e.target.value)}
                      className="mt-1 block w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-semibold text-slate-800 outline-none focus:border-brand-ink"
                    >
                      <option value="Front Chest">Front Chest</option>
                      <option value="Left Pocket">Left Pocket Minimal</option>
                      <option value="Back Print">Back Oversized</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">Font Style</label>
                    <select
                      value={fontStyle}
                      onChange={(e) => setFontStyle(e.target.value)}
                      className="mt-1 block w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-semibold text-slate-800 outline-none focus:border-brand-ink"
                    >
                      <option value="sans">Streetwear Bold (Sans)</option>
                      <option value="serif">Vintage Serif</option>
                      <option value="mono">Cyberpunk Mono</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">Select Garment Size</label>
                  <div className="mt-2 flex gap-2">
                    {['S', 'M', 'L', 'XL', 'XXL'].map((sz) => (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => setSelectedSize(sz)}
                        className={`min-w-12 rounded-full border px-3 py-2 text-xs font-bold transition cursor-pointer ${
                          selectedSize === sz
                            ? 'border-black bg-black text-white shadow-sm'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-black'
                        }`}
                      >
                        {sz}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Price & Action Summary */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">Total Custom Price</span>
                    <div className="text-3xl font-black text-brand-ink mt-0.5">₹{basePrice}</div>
                    <span className="text-[11px] text-emerald-600 font-semibold">Includes DTG print + 100% Cotton Tee</span>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-slate-100 text-xs font-bold text-slate-700 border border-slate-200">
                    COD Available
                  </span>
                </div>

                {addedNotice && (
                  <div className="mt-4 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-center text-xs font-bold text-emerald-700">
                    ✓ Custom Tee added to your cart!
                  </div>
                )}

                <div className="mt-6 flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleAddToCart}
                    className="flex-1 rounded-full border-2 border-black bg-white px-5 py-3.5 text-sm font-bold text-black hover:bg-slate-50 transition cursor-pointer"
                  >
                    Add to Cart
                  </button>
                  <button
                    onClick={handleBuyNow}
                    className="flex-1 rounded-full bg-black px-5 py-3.5 text-sm font-bold text-white hover:bg-slate-800 transition cursor-pointer shadow-md"
                  >
                    Order via COD Now
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
