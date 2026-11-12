import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { API_BASE_URL } from '../../config/api';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeRange, setTimeRange] = useState('7d');
  const [chartMetric, setChartMetric] = useState('sales'); // 'sales' or 'orders'
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [lowStockProducts, setLowStockProducts] = useState([]);

  useEffect(() => {
    fetchDashboardData(timeRange);
  }, [timeRange]);

  const fetchDashboardData = async (range) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const resStats = await fetch(`${API_BASE_URL}/api/admin/stats?timeRange=${range}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const dataStats = await resStats.json();
      if (dataStats.success) {
        setStats(dataStats.stats);
      } else {
        setError(dataStats.message || 'Failed to fetch analytics statistics');
      }

      const resProd = await fetch(`${API_BASE_URL}/api/products`);
      const dataProd = await resProd.json();
      if (dataProd.success) {
        const lowStock = [];
        dataProd.products.forEach((p) => {
          (p.variants || []).forEach((v) => {
            if (v.stock <= (v.safetyThreshold || 5)) {
              lowStock.push({
                title: p.title,
                sku: v.sku,
                size: v.size,
                color: v.color || p.color,
                stock: v.stock,
                threshold: v.safetyThreshold || 5,
              });
            }
          });
        });
        setLowStockProducts(lowStock.slice(0, 5));
      }
    } catch {
      setError('Error connecting to backend API');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !stats) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 w-48 bg-slate-200 rounded-xl"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((n) => (
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
        <button
          onClick={() => fetchDashboardData(timeRange)}
          className="mt-4 px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-semibold"
        >
          Retry
        </button>
      </div>
    );
  }

  const salesData = stats?.salesTrend || stats?.weeklySales || [];
  const maxVal = salesData.length
    ? Math.max(
        ...salesData.map((d) => (chartMetric === 'sales' ? d.totalSales : d.ordersCount)),
        chartMetric === 'sales' ? 1000 : 5
      )
    : 1000;

  const width = 640;
  const height = 200;
  const paddingX = 40;
  const paddingY = 30;

  const points = salesData.map((d, index) => {
    const val = chartMetric === 'sales' ? d.totalSales : d.ordersCount;
    const x =
      paddingX +
      (index * (width - paddingX * 2)) / Math.max(salesData.length - 1, 1);
    const y =
      height -
      paddingY -
      (val * (height - paddingY * 2)) / (maxVal || 1);
    return { x, y, label: d.label || d._id?.slice(5), val, fullData: d };
  });

  const pathD =
    points.length > 0
      ? `M ${points[0].x} ${points[0].y} ` +
        points
          .slice(1)
          .map((p) => `L ${p.x} ${p.y}`)
          .join(' ')
      : '';

  const areaD =
    points.length > 0
      ? `${pathD} L ${points[points.length - 1].x} ${height - paddingY} L ${
          points[0].x
        } ${height - paddingY} Z`
      : '';

  const statusTotals = stats?.orderStatusBreakdown || {};
  const totalOrdersCount = stats?.ordersCount || 1;

  return (
    <div className="space-y-8">
      {/* Top Header & Dynamic Range Filter */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">Business Intelligence</h1>
          <p className="text-slate-500 text-sm mt-1">Real-time revenue flows, stock alerts, and fulfillment velocities.</p>
        </div>

        {/* Dynamic Period Selector */}
        <div className="inline-flex rounded-2xl bg-white p-1 border border-slate-200 shadow-xs self-start sm:self-auto">
          {[
            { id: '7d', label: '7 Days' },
            { id: '30d', label: '30 Days' },
            { id: 'all', label: 'All Time' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTimeRange(t.id)}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                timeRange === t.id
                  ? 'bg-black text-white shadow-sm'
                  : 'text-slate-600 hover:text-black hover:bg-slate-50'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Gross Revenue */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm relative overflow-hidden group hover:border-emerald-300 hover:shadow-md transition-all duration-300">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Gross Sales Value</p>
              <h3 className="text-3xl font-black text-slate-900 mt-2">₹{(stats?.grossSales || 0).toLocaleString()}</h3>
            </div>
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-600">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-4 flex items-center justify-between">
            <span>AOV: <strong className="text-slate-800">₹{stats?.aov || 0}</strong></span>
            <span className="text-emerald-600 font-semibold">• Active</span>
          </p>
        </div>

        {/* Net Profit Margin */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm relative overflow-hidden group hover:border-indigo-300 hover:shadow-md transition-all duration-300">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Net Profit</p>
              <h3 className="text-3xl font-black text-slate-900 mt-2">₹{(stats?.netProfit || 0).toLocaleString()}</h3>
            </div>
            <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-2xl text-indigo-600">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-4">
            Tax: ₹{(stats?.totalTax || 0).toLocaleString()} • COGS: ₹{(stats?.totalCostBasis || 0).toLocaleString()}
          </p>
        </div>

        {/* Total Orders */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm relative overflow-hidden group hover:border-amber-300 hover:shadow-md transition-all duration-300">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Total Orders</p>
              <h3 className="text-3xl font-black text-slate-900 mt-2">{stats?.ordersCount || 0}</h3>
            </div>
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-amber-600">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-4">
            Delivered: <strong className="text-emerald-600">{stats?.deliveredCount || 0}</strong> • Cancelled: <strong className="text-red-500">{stats?.cancelledCount || 0}</strong>
          </p>
        </div>

        {/* Low Stock Warnings */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm relative overflow-hidden group hover:border-red-300 hover:shadow-md transition-all duration-300">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Low Stock Warnings</p>
              <h3 className="text-3xl font-black text-slate-900 mt-2">{stats?.lowStockCount || 0}</h3>
            </div>
            <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-red-500">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
          <p className="text-xs text-red-500 mt-4 font-medium">Require catalog replenishment</p>
        </div>
      </div>

      {/* Main Dynamic Chart + Stock Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Dynamic Interactive SVG Chart */}
        <div className="lg:col-span-2 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                {chartMetric === 'sales' ? 'Revenue Velocity Trend (₹)' : 'Order Volume Trend'}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Dynamic timeline for {timeRange === '7d' ? 'last 7 days' : timeRange === '30d' ? 'last 30 days' : 'all recorded time'}
              </p>
            </div>

            {/* Metric Toggle */}
            <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200">
              <button
                onClick={() => setChartMetric('sales')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  chartMetric === 'sales' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Revenue (₹)
              </button>
              <button
                onClick={() => setChartMetric('orders')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  chartMetric === 'orders' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Orders
              </button>
            </div>
          </div>

          {salesData.length > 0 ? (
            <div className="w-full relative">
              <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
                {/* Horizontal guide lines */}
                <line x1={paddingX} y1={paddingY} x2={width - paddingX} y2={paddingY} stroke="rgba(0,0,0,0.06)" strokeWidth={1} strokeDasharray="4" />
                <line x1={paddingX} y1={height / 2} x2={width - paddingX} y2={height / 2} stroke="rgba(0,0,0,0.06)" strokeWidth={1} strokeDasharray="4" />
                <line x1={paddingX} y1={height - paddingY} x2={width - paddingX} y2={height - paddingY} stroke="rgba(0,0,0,0.12)" strokeWidth={1} />

                {/* Shaded Area & Line */}
                <path d={areaD} fill="url(#dynamicAreaGrad)" />
                <path d={pathD} fill="none" stroke="url(#dynamicLineGrad)" strokeWidth={3} strokeLinecap="round" />

                {/* Data Points */}
                {points.map((p, idx) => (
                  <g
                    key={idx}
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredPoint(p)}
                    onMouseLeave={() => setHoveredPoint(null)}
                  >
                    <circle cx={p.x} cy={p.y} r={p.val > 0 ? 5 : 3} fill={chartMetric === 'sales' ? '#10B981' : '#6366F1'} stroke="#fff" strokeWidth={2} />
                    <circle cx={p.x} cy={p.y} r={12} fill={chartMetric === 'sales' ? '#10B981' : '#6366F1'} className="opacity-0 hover:opacity-20 transition-opacity" />
                    {/* X-axis date labels */}
                    {(points.length <= 10 || idx % Math.ceil(points.length / 8) === 0) && (
                      <text x={p.x} y={height - 8} textAnchor="middle" fill="#94A3B8" className="text-[10px] font-medium">
                        {p.label}
                      </text>
                    )}
                  </g>
                ))}

                <defs>
                  <linearGradient id="dynamicLineGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor={chartMetric === 'sales' ? '#059669' : '#4F46E5'} />
                    <stop offset="100%" stopColor={chartMetric === 'sales' ? '#10B981' : '#8B5CF6'} />
                  </linearGradient>
                  <linearGradient id="dynamicAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={chartMetric === 'sales' ? '#10B981' : '#6366F1'} stopOpacity="0.25" />
                    <stop offset="100%" stopColor={chartMetric === 'sales' ? '#10B981' : '#6366F1'} stopOpacity="0.0" />
                  </linearGradient>
                </defs>
              </svg>

              {/* Dynamic Interactive Tooltip */}
              {hoveredPoint && (
                <div
                  className="absolute pointer-events-none bg-slate-900 text-white px-3 py-2 rounded-xl text-xs shadow-xl border border-slate-700 z-10 -translate-x-1/2 -translate-y-full"
                  style={{
                    left: `${(hoveredPoint.x / width) * 100}%`,
                    top: `${(hoveredPoint.y / height) * 100}%`,
                    marginTop: '-12px',
                  }}
                >
                  <div className="font-bold text-slate-300 text-[10px]">{hoveredPoint.label}</div>
                  <div className="font-extrabold text-sm text-emerald-400 mt-0.5">₹{hoveredPoint.fullData.totalSales.toLocaleString()}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{hoveredPoint.fullData.ordersCount} orders placed</div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex h-48 items-center justify-center text-slate-400 text-sm">No sales activity in this period.</div>
          )}

          {/* Quick Summary Footer */}
          <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500">
            <span>Peak Day Value: <strong className="text-slate-800">₹{maxVal.toLocaleString()}</strong></span>
            <span>Customer Base: <strong className="text-slate-800">{stats?.customersCount || 0} registered</strong></span>
          </div>
        </div>

        {/* Stock Alerts Matrix */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-900">Stock Alerts</h3>
              <Link to="/admin/catalog" className="text-xs font-semibold text-indigo-600 hover:underline">
                View Catalog →
              </Link>
            </div>

            <div className="space-y-3">
              {lowStockProducts.length > 0 ? (
                lowStockProducts.map((p, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center p-3 rounded-2xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-colors"
                  >
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 truncate max-w-[150px]">{p.title}</h4>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        Color: {p.color} • Size: {p.size}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex px-2 py-0.5 rounded-full bg-red-50 text-red-600 text-[10px] font-bold border border-red-200">
                        {p.stock} Units Left
                      </span>
                      <p className="text-[9px] text-slate-400 mt-0.5">Safety: {p.threshold}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                  <svg className="w-10 h-10 text-emerald-500/40 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-xs font-semibold text-slate-600">All SKUs Fully Stocked</p>
                  <p className="text-[10px] text-slate-400 text-center mt-1">No items have breached minimum safety thresholds.</p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-500 flex justify-between items-center">
            <span>Critical Variants: <strong className="text-red-600">{stats?.lowStockCount || 0}</strong></span>
            <Link to="/admin/catalog" className="text-xs text-indigo-600 font-semibold hover:underline">
              Add Inventory
            </Link>
          </div>
        </div>
      </div>

      {/* Secondary Dynamic Section: Order Status Distribution & Top Best Sellers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Order Status Distribution */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Order Pipeline & Fulfillment</h3>
          <div className="space-y-3">
            {[
              { key: 'delivered', label: 'Delivered', count: statusTotals.delivered || 0, color: 'bg-emerald-500' },
              { key: 'shipped', label: 'Shipped (In Transit)', count: statusTotals.shipped || 0, color: 'bg-indigo-500' },
              { key: 'processing', label: 'Processing & Pack', count: statusTotals.processing || 0, color: 'bg-amber-500' },
              { key: 'pending', label: 'Pending Confirmation', count: statusTotals.pending || 0, color: 'bg-blue-500' },
              { key: 'cancelled', label: 'Cancelled', count: statusTotals.cancelled || 0, color: 'bg-red-500' },
              { key: 'returned', label: 'RMA / Returned', count: statusTotals.returned || 0, color: 'bg-slate-400' },
            ].map((st) => {
              const pct = Math.round(((st.count || 0) / (stats?.ordersCount || 1)) * 100);
              return (
                <div key={st.key} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-700">{st.label}</span>
                    <span className="text-slate-500">
                      <strong>{st.count}</strong> ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div className={`h-full rounded-full ${st.color} transition-all duration-500`} style={{ width: `${pct}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Performing Best Sellers */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Top Performing Drops</h3>
          <div className="space-y-3">
            {stats?.topProducts && stats.topProducts.length > 0 ? (
              stats.topProducts.map((p, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-slate-900 text-white text-xs font-black">
                      #{idx + 1}
                    </div>
                    {p.img && (
                      <img src={p.img} alt={p.title} className="h-10 w-10 rounded-xl object-cover bg-white border border-slate-200" />
                    )}
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 line-clamp-1">{p.title}</h4>
                      <p className="text-[10px] text-slate-500">{p.qty} units fulfilled</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-slate-900">₹{p.revenue.toLocaleString()}</div>
                    <span className="text-[9px] text-emerald-600 font-semibold">Leaderboard</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-xs text-slate-400">No product sales recorded yet.</div>
            )}
          </div>
        </div>
      </div>

      {/* Live Recent Orders Feed */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Recent Customer Orders</h3>
            <p className="text-xs text-slate-400 mt-0.5">Live incoming transaction stream</p>
          </div>
          <Link
            to="/admin/orders"
            className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition"
          >
            Manage All Orders →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider">
                <th className="px-4 py-3">Order ID</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Items</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Method</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {stats?.recentOrders && stats.recentOrders.length > 0 ? (
                stats.recentOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3 font-mono font-bold text-slate-900">{String(o.id).slice(-8)}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800">{o.customerName}</td>
                    <td className="px-4 py-3">{o.itemsCount} pcs</td>
                    <td className="px-4 py-3 font-bold text-emerald-600">₹{Number(o.amount).toLocaleString()}</td>
                    <td className="px-4 py-3 uppercase font-mono text-[10px]">{o.paymentMethod}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border bg-slate-100 text-slate-700 border-slate-200">
                        {o.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-[10px]">
                      {new Date(o.createdAt).toLocaleDateString(undefined, { day: '2-digit', month: 'short' })}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    No orders placed yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
