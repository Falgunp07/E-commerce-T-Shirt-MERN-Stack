import { useEffect, useState } from 'react';

export default function AdminCMS() {
  const [banners, setBanners] = useState([]);
  const [bentoGridOrder, setBentoGridOrder] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newBannerImg, setNewBannerImg] = useState('');
  const [newBannerLink, setNewBannerLink] = useState('');
  const [newBannerFrom, setNewBannerFrom] = useState('');
  const [newBannerTo, setNewBannerTo] = useState('');

  const token = localStorage.getItem('adminToken');

  useEffect(() => { fetchCmsData(); }, []);

  const fetchCmsData = async () => {
    setLoading(true);
    try {
      const resCms = await fetch('http://localhost:5000/api/admin/cms', { headers: { 'Authorization': `Bearer ${token}` } });
      const dataCms = await resCms.json();
      if (dataCms.success) { setBanners(dataCms.cms.banners || []); setBentoGridOrder(dataCms.cms.bentoGridOrder || []); } else { setError(dataCms.message || 'Error loading CMS configurations'); }
      const resProd = await fetch('http://localhost:5000/api/products');
      const dataProd = await resProd.json();
      if (dataProd.success) { setProducts(dataProd.products || []); }
    } catch (err) { setError('Cannot connect to CMS configuration service API'); } finally { setLoading(false); }
  };

  const handleSaveBanners = async (updatedBanners) => {
    try {
      const res = await fetch('http://localhost:5000/api/admin/cms', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ key: 'home_banners', banners: updatedBanners }) });
      const data = await res.json();
      if (data.success) { setBanners(data.config.banners); } else { alert(data.message || 'Failed to update banners config'); }
    } catch (err) { alert('Network error'); }
  };

  const handleAddBanner = (e) => {
    e.preventDefault();
    if (!newBannerImg) return;
    const newBanner = { imageUrl: newBannerImg, linkUrl: newBannerLink, activeFrom: newBannerFrom ? new Date(newBannerFrom) : undefined, activeTo: newBannerTo ? new Date(newBannerTo) : undefined, isActive: true };
    handleSaveBanners([...banners, newBanner]);
    setNewBannerImg(''); setNewBannerLink(''); setNewBannerFrom(''); setNewBannerTo('');
  };

  const handleDeleteBanner = (index) => {
    if (!window.confirm('Delete this banner schedule?')) return;
    handleSaveBanners(banners.filter((_, idx) => idx !== index));
  };

  const toggleBannerState = (index) => {
    const updated = [...banners]; updated[index].isActive = !updated[index].isActive;
    handleSaveBanners(updated);
  };

  const handleSaveBentoOrder = async (orderList) => {
    try {
      const res = await fetch('http://localhost:5000/api/admin/cms', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ key: 'bento_grid_priority', bentoGridOrder: orderList }) });
      const data = await res.json();
      if (data.success) { setBentoGridOrder(data.config.bentoGridOrder); alert('Homepage Bento Grid Order Priority Updated Successfully!'); } else { alert(data.message || 'Failed to update bento config'); }
    } catch (err) { alert('Network error'); }
  };

  const moveItem = (index, direction) => {
    const updated = [...bentoGridOrder]; const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= updated.length) return;
    const temp = updated[index]; updated[index] = updated[targetIdx]; updated[targetIdx] = temp;
    setBentoGridOrder(updated);
  };

  const addToBento = (productId) => { if (bentoGridOrder.includes(productId)) return; setBentoGridOrder([...bentoGridOrder, productId]); };
  const removeFromBento = (productId) => { setBentoGridOrder(bentoGridOrder.filter(id => id !== productId)); };

  if (loading) return (
    <div className="space-y-4 animate-pulse">
      <div className="h-10 w-56 bg-slate-200 rounded-xl"></div>
      <div className="h-48 bg-slate-200 rounded-3xl"></div>
      <div className="h-48 bg-slate-200 rounded-3xl"></div>
    </div>
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900">Storefront CMS Control</h1>
        <p className="text-slate-500 text-sm mt-1">Schedule billboard marketing banners and override storefront bento sorting lists.</p>
      </div>

      {/* Banner Manager */}
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm space-y-6">
        <h3 className="text-lg font-bold text-slate-900">📸 Billboard Banner Scheduler</h3>
        <form onSubmit={handleAddBanner} className="rounded-2xl bg-slate-50 border border-slate-200 p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase">Banner Image URL</label>
              <input type="text" required value={newBannerImg} onChange={(e) => setNewBannerImg(e.target.value)} className="mt-1 block w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-slate-900 text-sm focus:border-indigo-500 focus:outline-hidden" placeholder="https://images.unsplash.com/..." />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase">Click-Through Link</label>
              <input type="text" value={newBannerLink} onChange={(e) => setNewBannerLink(e.target.value)} className="mt-1 block w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-slate-900 text-sm focus:border-indigo-500 focus:outline-hidden" placeholder="/shop?category=oversized" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase">Schedule From</label>
              <input type="date" value={newBannerFrom} onChange={(e) => setNewBannerFrom(e.target.value)} className="mt-1 block w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-slate-900 text-sm focus:border-indigo-500 focus:outline-hidden" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase">Schedule To</label>
              <input type="date" value={newBannerTo} onChange={(e) => setNewBannerTo(e.target.value)} className="mt-1 block w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-slate-900 text-sm focus:border-indigo-500 focus:outline-hidden" />
            </div>
          </div>
          <button type="submit" className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-500 transition-colors cursor-pointer text-sm shadow-md shadow-indigo-500/20">+ Add Billboard Banner</button>
        </form>

        {banners.length > 0 ? (
          <div className="space-y-3">
            {banners.map((b, idx) => (
              <div key={idx} className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 transition-colors">
                <div className="w-20 h-12 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex-shrink-0">
                  <img src={b.imageUrl} alt={`Banner ${idx + 1}`} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-700 truncate">{b.linkUrl || '(no link)'}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {b.activeFrom ? new Date(b.activeFrom).toLocaleDateString() : 'Always'} → {b.activeTo ? new Date(b.activeTo).toLocaleDateString() : 'Forever'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => toggleBannerState(idx)} className={`px-2.5 py-1 rounded-full text-[9px] font-bold border cursor-pointer transition-colors ${b.isActive ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                    {b.isActive ? 'Active' : 'Paused'}
                  </button>
                  <button onClick={() => handleDeleteBanner(idx)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-500 transition-colors cursor-pointer">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center py-8 text-slate-400 text-xs">No banners scheduled. Add your first marketing banner above.</p>
        )}
      </div>

      {/* Bento Grid Sort Priority */}
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <h3 className="text-lg font-bold text-slate-900">🧱 Homepage Bento Grid Sort Override</h3>
          <button onClick={() => handleSaveBentoOrder(bentoGridOrder)} className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-500 transition-colors cursor-pointer text-sm shadow-md shadow-emerald-500/20">Save Grid Priority Order</button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Available Products */}
          <div className="rounded-2xl bg-slate-50 border border-slate-200 p-6 space-y-3">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Available Products</h4>
            <div className="max-h-64 overflow-y-auto space-y-1 pr-1">
              {products.filter(p => !bentoGridOrder.includes(p._id)).map(p => (
                <button key={p._id} onClick={() => addToBento(p._id)} className="w-full text-left px-4 py-2 rounded-xl bg-white text-slate-700 text-xs hover:bg-slate-100 transition-colors truncate cursor-pointer border border-transparent hover:border-slate-200">
                  + {p.title}
                </button>
              ))}
              {products.filter(p => !bentoGridOrder.includes(p._id)).length === 0 && (
                <p className="text-xs text-slate-400 py-4 text-center">All products have been added to the priority queue.</p>
              )}
            </div>
          </div>

          {/* Priority Queue */}
          <div className="rounded-2xl bg-slate-50 border border-slate-200 p-6 space-y-3">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Priority Queue (Top → Bottom)</h4>
            <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1">
              {bentoGridOrder.map((id, idx) => {
                const p = products.find(prod => prod._id === id);
                return (
                  <div key={id} className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-indigo-50 border border-indigo-100 text-slate-700 text-xs">
                    <span className="text-slate-400 font-bold w-5 text-center">{idx + 1}</span>
                    <span className="flex-1 truncate font-medium">{p ? p.title : id}</span>
                    <div className="flex gap-1">
                      <button onClick={() => moveItem(idx, -1)} className="p-1 rounded bg-slate-100 text-slate-500 hover:bg-slate-200 cursor-pointer" title="Move up">↑</button>
                      <button onClick={() => moveItem(idx, 1)} className="p-1 rounded bg-slate-100 text-slate-500 hover:bg-slate-200 cursor-pointer" title="Move down">↓</button>
                      <button onClick={() => removeFromBento(id)} className="p-1 rounded bg-red-50 text-red-500 hover:bg-red-100 cursor-pointer" title="Remove">×</button>
                    </div>
                  </div>
                );
              })}
              {bentoGridOrder.length === 0 && (
                <p className="text-xs text-slate-400 py-4 text-center">No products in priority queue. Add products from the left panel.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
