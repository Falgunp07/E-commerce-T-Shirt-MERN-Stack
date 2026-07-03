import { useEffect, useState } from 'react';

export default function AdminCatalog() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userRole, setUserRole] = useState('');
  const [editingProduct, setEditingProduct] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('T-Shirts');
  const [subCategory, setSubCategory] = useState('');
  const [taxSlab, setTaxSlab] = useState(12);
  const [img, setImg] = useState('');
  const [images, setImages] = useState([]);
  const [imageUploadError, setImageUploadError] = useState('');
  const [variants, setVariants] = useState([]);
  const [newVarSize, setNewVarSize] = useState('M');
  const [newVarColor, setNewVarColor] = useState('');
  const [newVarStock, setNewVarStock] = useState(10);
  const [newVarThreshold, setNewVarThreshold] = useState(5);
  const [newVarCost, setNewVarCost] = useState('');
  const [newVarMrp, setNewVarMrp] = useState('');
  const [newVarPrice, setNewVarPrice] = useState('');

  const token = localStorage.getItem('adminToken');

  useEffect(() => {
    const userData = localStorage.getItem('adminUser');
    if (userData) { setUserRole(JSON.parse(userData).role); }
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/admin/products', { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) { setProducts(data.products); } else { setError(data.message || 'Failed to fetch catalog.'); }
    } catch (err) { setError('Cannot connect to backend server.'); } finally { setLoading(false); }
  };

  const handleEditClick = (product) => {
    setEditingProduct(product); setTitle(product.title); setDescription(product.description);
    setCategory(product.category || 'T-Shirts'); setSubCategory(product.subCategory || '');
    setTaxSlab(product.taxSlab || 12); setImg(product.img || product.images?.[0] || ''); setImages(product.images || (product.img ? [product.img] : [])); setImageUploadError(''); setVariants(product.variants || []);
    setShowAddForm(false);
  };

  const handleCreateClick = () => {
    setEditingProduct(null); setTitle(''); setDescription(''); setCategory('T-Shirts');
    setSubCategory('Oversized'); setTaxSlab(12);
    setImg('https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1200&q=80');
    setImages(['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1200&q=80']);
    setImageUploadError('');
    setVariants([]); setShowAddForm(true);
  };

  const handleImageFiles = async (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    const accepted = files.filter((file) => file.type.startsWith('image/'));
    if (accepted.length !== files.length) {
      setImageUploadError('Only image files are allowed.');
    } else {
      setImageUploadError('');
    }

    const previews = await Promise.all(
      accepted.map(
        (file) =>
          new Promise((resolve, reject) => {
            if (file.size > 5 * 1024 * 1024) {
              reject(new Error(`${file.name} is larger than 5MB`));
              return;
            }
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result || ''));
            reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
            reader.readAsDataURL(file);
          })
      )
    ).catch((error) => {
      setImageUploadError(error.message);
      return [];
    });

    if (!previews.length) return;

    setImages((current) => {
      const next = [...current, ...previews].filter(Boolean);
      setImg(next[0] || '');
      return next;
    });
  };

  const removeImage = (index) => {
    setImages((current) => {
      const next = current.filter((_, currentIndex) => currentIndex !== index);
      setImg(next[0] || '');
      return next;
    });
  };

  const handleAddVariant = (e) => {
    e.preventDefault();
    if (!newVarColor || !newVarCost || !newVarPrice || !newVarMrp) { alert('Please fill out all variant parameters (Color, Cost, MRP, Price)'); return; }
    const skuCode = `TL-${title.substring(0, 4).toUpperCase().replace(/\s+/g, '')}-${newVarColor.substring(0, 3).toUpperCase()}-${newVarSize}`;
    const newVariant = { sku: skuCode, size: newVarSize, color: newVarColor, stock: Number(newVarStock), safetyThreshold: Number(newVarThreshold), costPrice: Number(newVarCost), mrp: Number(newVarMrp), price: Number(newVarPrice), images: [img] };
    if (variants.some(v => v.sku === skuCode)) { alert('A variant with this Size/Color SKU already exists in this product context.'); return; }
    setVariants([...variants, newVariant]); setNewVarColor('');
  };

  const removeVariant = (index) => { setVariants(variants.filter((_, idx) => idx !== index)); };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (variants.length === 0) { alert('Please configure at least one SKU variant for the product matrix.'); return; }
    const firstVariant = variants[0];
    const derivedPrice = Number(firstVariant.price) || 0;
    const derivedColor = firstVariant.color || 'Black';
    const productImages = images.length ? images : [img];
    const payload = { title, description, category, subCategory, taxSlab: Number(taxSlab), price: derivedPrice, color: derivedColor, img: productImages[0] || img, images: [...productImages, ...(firstVariant.images || [])].filter((v, i, a) => a.indexOf(v) === i), variants };
    console.log('Saving product payload:', JSON.stringify(payload, null, 2));
    try {
      const url = editingProduct ? `http://localhost:5000/api/admin/products/${editingProduct._id}` : 'http://localhost:5000/api/admin/products';
      const method = editingProduct ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(payload) });
      const raw = await res.text();
      const data = raw ? JSON.parse(raw) : {};
      if (res.ok && data.success) { setEditingProduct(null); setShowAddForm(false); fetchProducts(); } else { alert(data.message || `Error occurred while saving catalog item. (${res.status})`); }
    } catch (err) { alert('Error connecting to save endpoint.'); }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Are you absolutely sure you want to hard delete this product and all its child SKUs? This action is irreversible.')) return;
    try {
      const res = await fetch(`http://localhost:5000/api/admin/products/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) { fetchProducts(); } else { alert(data.message || 'Delete operation failed.'); }
    } catch (err) { alert('Server network error.'); }
  };

  const calculateTaxSplit = (sellingPrice) => {
    if (!sellingPrice || isNaN(sellingPrice)) return { base: 0, tax: 0 };
    const base = Number((sellingPrice / (1 + taxSlab / 100)).toFixed(2));
    const tax = Number((sellingPrice - base).toFixed(2));
    return { base, tax };
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">Catalog SKU Matrix</h1>
          <p className="text-slate-500 text-sm mt-1">Configure parent-child products, stock thresholds, and tax divisions.</p>
        </div>
        <button onClick={handleCreateClick} className="px-5 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold hover:from-indigo-500 hover:to-violet-500 transition-all cursor-pointer shadow-lg shadow-indigo-500/20 flex items-center gap-2 self-start sm:self-auto">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
          Create New Product
        </button>
      </div>

      {(editingProduct || showAddForm) && (
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <h3 className="text-xl font-bold text-slate-900 mb-6">{editingProduct ? `Modify SKU Catalog: ${title}` : 'Build Brand New SKU'}</h3>
          <form onSubmit={handleSaveProduct} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Product Title</label>
                  <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 block w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 text-sm focus:border-indigo-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20" placeholder="Midnight Manga Oversized Tee" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Description</label>
                  <textarea required rows="3" value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1 block w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 text-sm focus:border-indigo-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20" placeholder="100% premium cotton tee..." />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Sub-Category</label>
                    <input type="text" value={subCategory} onChange={(e) => setSubCategory(e.target.value)} className="mt-1 block w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 text-sm focus:border-indigo-500 focus:outline-hidden" placeholder="Oversized" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">GST Tax Slab</label>
                    <select value={taxSlab} onChange={(e) => setTaxSlab(Number(e.target.value))} className="mt-1 block w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 text-sm focus:border-indigo-500 focus:outline-hidden">
                      <option value="5">5% GST (Low cost items)</option>
                      <option value="12">12% GST (Apparel standard)</option>
                      <option value="18">18% GST (Luxury items)</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Product Images</label>
                  <div className="mt-1 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageFiles}
                      className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-full file:border-0 file:bg-indigo-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-indigo-500"
                    />
                    <p className="mt-3 text-xs text-slate-500">Upload one or more product photos from your device. They will be saved with the product.</p>
                    {imageUploadError ? <p className="mt-2 text-xs font-semibold text-red-500">{imageUploadError}</p> : null}
                    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {images.map((source, index) => (
                        <div key={`${source.slice(0, 24)}-${index}`} className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white">
                          <img src={source} alt={`Product preview ${index + 1}`} className="h-28 w-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute right-2 top-2 rounded-full bg-black/80 px-2 py-1 text-[10px] font-semibold text-white"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                    {!images.length && (
                      <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 text-xs text-slate-500">
                        No image uploaded yet. Add at least one photo to represent the product.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 space-y-4">
                <h4 className="text-sm font-bold text-slate-800 border-b border-slate-200 pb-2">Add SKUs to Child Variant Matrix</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Size</label>
                    <select value={newVarSize} onChange={(e) => setNewVarSize(e.target.value)} className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900">
                      <option value="S">Small (S)</option><option value="M">Medium (M)</option><option value="L">Large (L)</option><option value="XL">Extra Large (XL)</option><option value="XXL">Double Extra Large (XXL)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Color</label>
                    <input type="text" value={newVarColor} onChange={(e) => setNewVarColor(e.target.value)} className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900" placeholder="Black, White, Neon" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Stock Count</label>
                    <input type="number" value={newVarStock} onChange={(e) => setNewVarStock(e.target.value)} className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Alert Threshold</label>
                    <input type="number" value={newVarThreshold} onChange={(e) => setNewVarThreshold(e.target.value)} className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Cost Price</label>
                    <input type="number" value={newVarCost} onChange={(e) => setNewVarCost(e.target.value)} className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900" placeholder="500" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">MRP</label>
                    <input type="number" value={newVarMrp} onChange={(e) => setNewVarMrp(e.target.value)} className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900" placeholder="1800" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Selling Price</label>
                    <input type="number" value={newVarPrice} onChange={(e) => setNewVarPrice(e.target.value)} className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900" placeholder="1299" />
                  </div>
                </div>
                {newVarPrice && (
                  <div className="rounded-xl bg-indigo-50 border border-indigo-100 p-3 text-[10px] text-indigo-700">
                    <span className="font-bold">GST Tax Splits breakdown:</span>
                    <div className="flex justify-between mt-1"><span>Base Value (before GST):</span><span>₹{calculateTaxSplit(newVarPrice).base}</span></div>
                    <div className="flex justify-between"><span>GST Amount Collected ({taxSlab}%):</span><span>₹{calculateTaxSplit(newVarPrice).tax}</span></div>
                  </div>
                )}
                <button type="button" onClick={handleAddVariant} className="w-full py-2 bg-slate-100 text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-200 hover:text-slate-900 transition-colors text-xs font-bold cursor-pointer">Insert SKU into Matrix List</button>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-bold text-slate-900">Active Product SKUs Matrix ({variants.length})</h4>
              {variants.length > 0 ? (
                <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead><tr className="border-b border-slate-200 bg-slate-50 text-slate-500"><th className="px-4 py-3">Generated SKU</th><th className="px-4 py-3">Size</th><th className="px-4 py-3">Color</th><th className="px-4 py-3">Stock level</th><th className="px-4 py-3">Cost Price</th><th className="px-4 py-3">MRP</th><th className="px-4 py-3">Selling Price</th><th className="px-4 py-3">Actions</th></tr></thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {variants.map((v, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="px-4 py-3 font-mono">{v.sku}</td>
                          <td className="px-4 py-3"><span className="px-1.5 py-0.5 rounded bg-slate-100 font-bold text-slate-700">{v.size}</span></td>
                          <td className="px-4 py-3">{v.color}</td>
                          <td className="px-4 py-3"><input type="number" value={v.stock} onChange={(e) => { const updated = [...variants]; updated[idx].stock = Number(e.target.value); setVariants(updated); }} className="w-16 bg-slate-50 border border-slate-300 rounded px-1 text-center text-slate-900" /></td>
                          <td className="px-4 py-3">₹{v.costPrice}</td>
                          <td className="px-4 py-3 text-slate-400 line-through">₹{v.mrp}</td>
                          <td className="px-4 py-3 font-bold text-emerald-600">₹{v.price}</td>
                          <td className="px-4 py-3"><button type="button" onClick={() => removeVariant(idx)} className="text-red-500 hover:text-red-600 text-[10px] cursor-pointer font-semibold">Remove SKU</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="border border-dashed border-slate-300 rounded-2xl py-8 text-center text-slate-400 text-xs">No child variants mapped yet. Add variants using the matrix form builder on the right.</div>
              )}
            </div>

            <div className="flex gap-4 justify-end border-t border-slate-200 pt-6">
              <button type="button" onClick={() => { setEditingProduct(null); setShowAddForm(false); }} className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer text-sm">Discard Changes</button>
              <button type="submit" className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-500 transition-colors cursor-pointer text-sm shadow-md shadow-indigo-500/20">Save Catalog Product</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3].map(n => (<div key={n} className="h-64 bg-slate-200 border border-slate-200 rounded-3xl"></div>))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((p) => {
            const totalStock = p.variants?.reduce((sum, v) => sum + (v.stock || 0), 0) || 0;
            const uniqueSizes = [...new Set(p.variants?.map(v => v.size) || [])].sort();
            return (
              <div key={p._id} className="rounded-3xl border border-slate-200 bg-white overflow-hidden relative flex flex-col group hover:border-slate-300 hover:shadow-md transition-all duration-300 shadow-sm">
                <div className="h-44 relative bg-slate-100 overflow-hidden">
                  <img src={p.img} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-white/80 to-transparent" />
                  {p.isFlashSale && (<span className="absolute top-4 left-4 inline-flex items-center rounded-full bg-indigo-600 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white shadow-lg">⚡ Flash Sale active</span>)}
                  <span className="absolute bottom-4 right-4 text-emerald-600 font-black text-xl drop-shadow-sm">₹{p.price}</span>
                </div>
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-lg truncate">{p.title}</h3>
                    <p className="text-slate-500 text-xs mt-1 line-clamp-2">{p.description}</p>
                    <div className="flex gap-2 flex-wrap mt-4">
                      {uniqueSizes.map(size => (<span key={size} className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-bold">{size}</span>))}
                    </div>
                  </div>
                  <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-between">
                    <div className="text-left">
                      <span className="text-[10px] text-slate-400 uppercase font-bold">Total Stock</span>
                      <p className={`text-sm font-extrabold ${totalStock < 25 ? 'text-red-600' : 'text-slate-700'}`}>{totalStock} Units</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleEditClick(p)} className="px-3.5 py-2 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold hover:bg-slate-200 transition-colors cursor-pointer">Edit Matrix</button>
                      {userRole === 'admin' && (
                        <button onClick={() => handleDeleteProduct(p._id)} className="p-2 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 transition-colors cursor-pointer" title="Delete product">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
