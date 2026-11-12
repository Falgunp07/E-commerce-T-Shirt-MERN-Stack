import { useEffect, useState } from 'react';
import { API_BASE_URL } from '../../config/api';

const ITEMS_PER_PAGE = 9;

export default function AdminCatalog() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userRole, setUserRole] = useState('');
  const [editingProduct, setEditingProduct] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
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

  // Lock body scroll and listen for Escape key when modal is open
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        handleCloseModal();
      }
    }
    if (editingProduct || showAddForm) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [editingProduct, showAddForm]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/products`, { headers: { 'Authorization': `Bearer ${token}` } });
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

  const handleCloseModal = () => {
    setEditingProduct(null);
    setShowAddForm(false);
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
    const skuCode = `TL-${(title || 'PROD').substring(0, 4).toUpperCase().replace(/\s+/g, '')}-${newVarColor.substring(0, 3).toUpperCase()}-${newVarSize}`;
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
    try {
      const url = editingProduct ? `${API_BASE_URL}/api/admin/products/${editingProduct._id}` : `${API_BASE_URL}/api/admin/products`;
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
      const res = await fetch(`${API_BASE_URL}/api/admin/products/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
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

  // 3x3 Pagination logic
  const totalPages = Math.max(1, Math.ceil(products.length / ITEMS_PER_PAGE));
  const effectivePage = Math.min(currentPage, totalPages);
  const currentProducts = products.slice((effectivePage - 1) * ITEMS_PER_PAGE, effectivePage * ITEMS_PER_PAGE);

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

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-600 text-sm font-medium">
          {error}
        </div>
      )}

      {/* Production-Grade Centered Modal Popup with High Z-Index */}
      {(editingProduct || showAddForm) && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-sm overflow-y-auto"
          onClick={(e) => { if (e.target === e.currentTarget) handleCloseModal(); }}
        >
          <div
            className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header Bar - Always Fixed & Visible */}
            <div className="flex items-center justify-between px-6 py-4 sm:px-8 sm:py-5 border-b border-slate-200 bg-white sticky top-0 z-30 shrink-0 shadow-2xs">
              <div className="min-w-0 pr-4">
                <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-indigo-700 border border-indigo-200">
                  SKU Matrix Manager
                </span>
                <h3 className="text-lg sm:text-xl font-black text-slate-900 mt-1 truncate">
                  {editingProduct ? `Edit Matrix: ${title || editingProduct.title}` : 'Build Brand New SKU'}
                </h3>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-800 transition cursor-pointer shrink-0"
                title="Close modal (Esc)"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-5 sm:p-7 md:p-8 overflow-y-auto flex-1 space-y-6">
              <form id="productForm" onSubmit={handleSaveProduct} className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
                  {/* Left Column: Basic Details */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Product Title</label>
                      <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-slate-900 text-xs sm:text-sm focus:border-indigo-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20" placeholder="Midnight Manga Oversized Tee" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Description</label>
                      <textarea required rows="3" value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-slate-900 text-xs sm:text-sm focus:border-indigo-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20" placeholder="100% premium cotton tee..." />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Sub-Category</label>
                        <input type="text" value={subCategory} onChange={(e) => setSubCategory(e.target.value)} className="mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-slate-900 text-xs sm:text-sm focus:border-indigo-500 focus:outline-hidden" placeholder="Oversized" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">GST Tax Slab</label>
                        <select value={taxSlab} onChange={(e) => setTaxSlab(Number(e.target.value))} className="mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-slate-900 text-xs sm:text-sm focus:border-indigo-500 focus:outline-hidden">
                          <option value="5">5% GST (Low cost items)</option>
                          <option value="12">12% GST (Apparel standard)</option>
                          <option value="18">18% GST (Luxury items)</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Product Photos</label>
                      <div className="mt-1 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-3.5 sm:p-4">
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleImageFiles}
                          className="block w-full text-xs sm:text-sm text-slate-600 file:mr-3 file:rounded-full file:border-0 file:bg-indigo-600 file:px-3.5 file:py-1.5 file:text-xs file:font-bold file:text-white hover:file:bg-indigo-500 cursor-pointer"
                        />
                        <p className="mt-2 text-[11px] text-slate-500">Upload one or more photos from your device.</p>
                        {imageUploadError ? <p className="mt-2 text-xs font-semibold text-red-500">{imageUploadError}</p> : null}
                        <div className="mt-3.5 grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                          {images.map((source, index) => (
                            <div key={`${source.slice(0, 24)}-${index}`} className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-100 h-24 sm:h-28 flex items-center justify-center">
                              <img
                                src={source}
                                alt=""
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  if (e.currentTarget.nextSibling) e.currentTarget.nextSibling.style.display = 'flex';
                                }}
                                className="h-full w-full object-cover"
                              />
                              <div className="hidden flex-col items-center justify-center p-2 text-center text-[10px] text-slate-400">
                                <svg className="w-5 h-5 mb-1 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                Image #{index + 1}
                              </div>
                              <button
                                type="button"
                                onClick={() => removeImage(index)}
                                className="absolute right-1.5 top-1.5 rounded-full bg-black/80 hover:bg-black text-white p-1 text-[9px] font-bold shadow-md transition cursor-pointer"
                                title="Remove photo"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                              </button>
                            </div>
                          ))}
                        </div>
                        {!images.length && (
                          <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3 text-center text-xs text-slate-400">
                            No photo attached yet.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: SKU Matrix Builder */}
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5 space-y-4">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-800 border-b border-slate-200 pb-2">Add SKUs to Child Variant Matrix</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">Size</label>
                        <select value={newVarSize} onChange={(e) => setNewVarSize(e.target.value)} className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900">
                          <option value="S">Small (S)</option><option value="M">Medium (M)</option><option value="L">Large (L)</option><option value="XL">Extra Large (XL)</option><option value="XXL">Double Extra Large (XXL)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">Color</label>
                        <input type="text" value={newVarColor} onChange={(e) => setNewVarColor(e.target.value)} className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900" placeholder="e.g. Yellow, Black, Navy" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">Stock Count</label>
                        <input type="number" value={newVarStock} onChange={(e) => setNewVarStock(e.target.value)} className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">Alert Threshold</label>
                        <input type="number" value={newVarThreshold} onChange={(e) => setNewVarThreshold(e.target.value)} className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">Cost Price</label>
                        <div className="relative mt-1">
                          <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 text-xs text-slate-400 font-bold">₹</span>
                          <input type="number" value={newVarCost} onChange={(e) => setNewVarCost(e.target.value)} className="w-full rounded-lg border border-slate-300 bg-white pl-6 pr-2 py-1.5 text-xs text-slate-900 focus:border-indigo-500 focus:outline-hidden" placeholder="500" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">MRP</label>
                        <div className="relative mt-1">
                          <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 text-xs text-slate-400 font-bold">₹</span>
                          <input type="number" value={newVarMrp} onChange={(e) => setNewVarMrp(e.target.value)} className="w-full rounded-lg border border-slate-300 bg-white pl-6 pr-2 py-1.5 text-xs text-slate-900 focus:border-indigo-500 focus:outline-hidden" placeholder="1800" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">Selling Price</label>
                        <div className="relative mt-1">
                          <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 text-xs text-slate-400 font-bold">₹</span>
                          <input type="number" value={newVarPrice} onChange={(e) => setNewVarPrice(e.target.value)} className="w-full rounded-lg border border-slate-300 bg-white pl-6 pr-2 py-1.5 text-xs text-slate-900 focus:border-indigo-500 focus:outline-hidden" placeholder="1299" />
                        </div>
                      </div>
                    </div>
                    {newVarPrice && (
                      <div className="rounded-xl bg-indigo-50 border border-indigo-100 p-3 text-[10px] text-indigo-700">
                        <span className="font-bold">GST Tax Splits breakdown:</span>
                        <div className="flex justify-between mt-1"><span>Base Value (before GST):</span><span>₹{calculateTaxSplit(newVarPrice).base}</span></div>
                        <div className="flex justify-between"><span>GST Amount Collected ({taxSlab}%):</span><span>₹{calculateTaxSplit(newVarPrice).tax}</span></div>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={handleAddVariant}
                      className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition text-xs font-bold cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                      Add Variant to Matrix List
                    </button>
                  </div>
                </div>

                {/* SKU Variants Table with Horizontal Scrolling */}
                <div className="space-y-2">
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900">Active Product SKUs Matrix ({variants.length})</h4>
                  {variants.length > 0 ? (
                    <div className="overflow-x-auto w-full rounded-2xl border border-slate-200 bg-white shadow-2xs">
                      <table className="min-w-[680px] w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 text-[11px]">
                            <th className="px-3.5 py-2.5">Generated SKU</th>
                            <th className="px-3.5 py-2.5">Size</th>
                            <th className="px-3.5 py-2.5">Color</th>
                            <th className="px-3.5 py-2.5">Stock level</th>
                            <th className="px-3.5 py-2.5">Cost Price</th>
                            <th className="px-3.5 py-2.5">MRP</th>
                            <th className="px-3.5 py-2.5">Selling Price</th>
                            <th className="px-3.5 py-2.5 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                          {variants.map((v, idx) => (
                            <tr key={idx} className="hover:bg-slate-50">
                              <td className="px-3.5 py-2.5 font-mono text-[11px] font-bold text-slate-800">{v.sku}</td>
                              <td className="px-3.5 py-2.5"><span className="px-2 py-0.5 rounded bg-slate-100 font-bold text-slate-700 text-[10px]">{v.size}</span></td>
                              <td className="px-3.5 py-2.5 font-medium">{v.color}</td>
                              <td className="px-3.5 py-2.5">
                                <input type="number" value={v.stock} onChange={(e) => { const updated = [...variants]; updated[idx].stock = Number(e.target.value); setVariants(updated); }} className="w-16 bg-slate-50 border border-slate-300 rounded px-1.5 py-1 text-center text-slate-900 text-xs font-bold" />
                              </td>
                              <td className="px-3.5 py-2.5">₹{v.costPrice}</td>
                              <td className="px-3.5 py-2.5 text-slate-400 line-through">₹{v.mrp}</td>
                              <td className="px-3.5 py-2.5 font-bold text-emerald-600">₹{v.price}</td>
                              <td className="px-3.5 py-2.5 text-right">
                                <button type="button" onClick={() => removeVariant(idx)} className="px-2.5 py-1 rounded-lg text-red-600 hover:bg-red-50 text-[11px] cursor-pointer font-bold transition">Remove</button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="border border-dashed border-slate-300 rounded-2xl py-6 text-center text-slate-400 text-xs">
                      No child variants mapped yet. Add variants using the matrix form builder on the right.
                    </div>
                  )}
                </div>
              </form>
            </div>

            {/* Modal Footer - Always Fixed & Visible */}
            <div className="flex flex-col-reverse sm:flex-row gap-3 justify-end items-stretch sm:items-center px-6 py-4 sm:px-8 border-t border-slate-200 bg-slate-50/95 sticky bottom-0 z-30 shrink-0 backdrop-blur-md">
              <button
                type="button"
                onClick={handleCloseModal}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 transition text-xs sm:text-sm font-bold cursor-pointer"
              >
                Discard Changes
              </button>
              <button
                type="submit"
                form="productForm"
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition text-xs sm:text-sm shadow-md shadow-indigo-500/25 cursor-pointer"
              >
                Save Catalog Product
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3x3 Products Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (<div key={n} className="h-64 bg-slate-200 border border-slate-200 rounded-3xl"></div>))}
        </div>
      ) : products.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentProducts.map((p) => {
              const totalStock = p.variants?.reduce((sum, v) => sum + (v.stock || 0), 0) || 0;
              const uniqueSizes = [...new Set(p.variants?.map(v => v.size) || [])].sort();
              return (
                <div key={p._id} className="rounded-3xl border border-slate-200 bg-white overflow-hidden relative flex flex-col group hover:border-slate-300 hover:shadow-md transition-all duration-300 shadow-sm">
                  <div className="h-48 relative bg-slate-100 overflow-hidden">
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

          {/* Centered Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex flex-col items-center justify-center gap-3 pt-8 pb-4">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={effectivePage === 1}
                  className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-xs transition cursor-pointer"
                >
                  ← Previous
                </button>
                <div className="flex items-center gap-1.5">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      type="button"
                      onClick={() => setCurrentPage(page)}
                      className={`w-9 h-9 rounded-xl text-xs font-bold transition cursor-pointer ${
                        effectivePage === page
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={effectivePage === totalPages}
                  className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-xs transition cursor-pointer"
                >
                  Next →
                </button>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Showing {(effectivePage - 1) * ITEMS_PER_PAGE + 1} to {Math.min(effectivePage * ITEMS_PER_PAGE, products.length)} of {products.length} catalog items
              </p>
            </div>
          )}
        </>
      ) : (
        <div className="border border-slate-200 bg-white rounded-3xl py-16 text-center text-slate-500 text-sm shadow-sm">
          No products found in catalog. Click "Create New Product" above to build your first SKU.
        </div>
      )}
    </div>
  );
}
