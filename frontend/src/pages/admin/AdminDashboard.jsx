import { useEffect, useState } from 'react';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lowStockProducts, setLowStockProducts] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem('adminToken');
        const resStats = await fetch('http://localhost:5000/api/admin/stats', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const dataStats = await resStats.json();
        if (dataStats.success) {
          setStats(dataStats.stats);
        } else {
          setError(dataStats.message || 'Failed to fetch analytics statistics');
        }
        const resProd = await fetch('http://localhost:5000/api/products');
        const dataProd = await resProd.json();
        if (dataProd.success) {
          const lowStock = [];
          dataProd.products.forEach(p => {
            p.variants.forEach(v => {
              if (v.stock <= (v.safetyThreshold || 5)) {
                lowStock.push({ title: p.title, sku: v.sku, size: v.size, color: v.color, stock: v.stock, threshold: v.safetyThreshold || 5 });
              }
            });
          });
          setLowStockProducts(lowStock.slice(0, 5));
        }
      } catch (err) {
        setError('Error connecting to backend API');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 w-48 bg-slate-200 rounded-xl"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(n => (
            <div key={n} className="h-32 bg-white border border-slate-200 rounded-3xl"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-red-600">
        <h3 className="font-bold text-lg">Error Loading Dashboard</h3>
        <p className="mt-1 text-sm">{error}</p>
      </div>
    );
  }

  const salesData = stats.weeklySales || [];
  const maxSale = salesData.length ? Math.max(...salesData.map(d => d.totalSales), 1000) : 1000;
  const width = 600;
  const height = 180;
  const padding = 25;
  const points = salesData.map((d, index) => {
    const x = padding + (index * (width - padding * 2)) / Math.max(salesData.length - 1, 1);
    const y = height - padding - (d.totalSales * (height - padding * 2)) / maxSale;
    return { x, y, label: d._id, val: d.totalSales };
  });
  const pathD = points.length > 0 ? `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ') : '';
  const areaD = points.length > 0 ? `${pathD} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z` : '';

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900">Business Intelligence</h1>
        <p className="text-slate-500 text-sm mt-1">Real-time revenue flows, stock alerts, and fulfillment velocities.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.grossSales !== null && (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm relative overflow-hidden group hover:border-emerald-300 hover:shadow-md transition-all duration-300">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Gross Sales Value</p>
                <h3 className="text-3xl font-black text-slate-900 mt-2">₹{stats.grossSales.toLocaleString()}</h3>
              </div>
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-600">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-4"><span className="text-emerald-600 font-semibold">&bull; Live</span> excluding cancelled orders</p>
          </div>
        )}

        {stats.netProfit !== null && (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm relative overflow-hidden group hover:border-indigo-300 hover:shadow-md transition-all duration-300">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Net Profit Margin</p>
                <h3 className="text-3xl font-black text-slate-900 mt-2">₹{Math.floor(stats.netProfit).toLocaleString()}</h3>
              </div>
              <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-2xl text-indigo-600">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-4">Taxes, item costs & fees split</p>
          </div>
        )}

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm relative overflow-hidden group hover:border-amber-300 hover:shadow-md transition-all duration-300">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Total Orders</p>
              <h3 className="text-3xl font-black text-slate-900 mt-2">{stats.ordersCount}</h3>
            </div>
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-amber-600">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-4">Orders pending & delivered</p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm relative overflow-hidden group hover:border-red-300 hover:shadow-md transition-all duration-300">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Low Stock Warnings</p>
              <h3 className="text-3xl font-black text-slate-900 mt-2">{stats.lowStockCount}</h3>
            </div>
            <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-red-500">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
          </div>
          <p className="text-xs text-red-500 mt-4 font-medium">Require catalog replenishment</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Weekly Sales Revenue Trend</h3>
          {salesData.length > 0 ? (
            <div className="w-full relative">
              <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
                <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="rgba(0,0,0,0.05)" strokeWidth={1} strokeDasharray="4" />
                <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="rgba(0,0,0,0.05)" strokeWidth={1} strokeDasharray="4" />
                <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="rgba(0,0,0,0.1)" strokeWidth={1} />
                <path d={areaD} fill="url(#salesAreaGrad)" />
                <path d={pathD} fill="none" stroke="url(#salesLineGrad)" strokeWidth={3} strokeLinecap="round" />
                {points.map((p, idx) => (
                  <g key={idx} className="group cursor-pointer">
                    <circle cx={p.x} cy={p.y} r={4} fill="#6366F1" stroke="#fff" strokeWidth={2} />
                    <circle cx={p.x} cy={p.y} r={8} fill="#6366F1" className="opacity-0 group-hover:opacity-20 transition-opacity" />
                    <text x={p.x} y={p.y - 12} textAnchor="middle" fill="#334155" className="text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity">₹{p.val}</text>
                    <text x={p.x} y={height - 8} textAnchor="middle" fill="#94A3B8" className="text-[9px]">{p.label.substring(5)}</text>
                  </g>
                ))}
                <defs>
                  <linearGradient id="salesLineGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#6366F1" />
                    <stop offset="100%" stopColor="#8B5CF6" />
                  </linearGradient>
                  <linearGradient id="salesAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366F1" stopOpacity="0.12" />
                    <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          ) : (
            <div className="flex h-48 items-center justify-center text-slate-400 text-sm">No sales recorded in the past 7 days.</div>
          )}
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Stock Alerts Matrix</h3>
          <div className="space-y-4">
            {lowStockProducts.length > 0 ? (
              lowStockProducts.map((p, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 rounded-2xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-colors">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 truncate max-w-[150px]">{p.title}</h4>
                    <p className="text-[10px] text-slate-500 mt-1">SKU: <span className="font-mono text-slate-600">{p.sku}</span></p>
                    <p className="text-[10px] text-slate-500">Color: {p.color} &bull; Size: {p.size}</p>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex px-2 py-0.5 rounded-full bg-red-50 text-red-600 text-[10px] font-bold border border-red-200">{p.stock} Units Left</span>
                    <p className="text-[9px] text-slate-400 mt-1">Min Safe: {p.threshold}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <svg className="w-10 h-10 text-emerald-500/40 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <p className="text-xs font-semibold text-slate-500">All SKUs Secure</p>
                <p className="text-[10px] text-slate-400 text-center mt-1">No items have breached minimum safety thresholds.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
