import { useEffect, useState } from 'react';

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedLabelOrder, setSelectedLabelOrder] = useState(null);
  const [selectedRmaOrder, setSelectedRmaOrder] = useState(null);
  const [qcRating, setQcRating] = useState('passed');
  const [qcComment, setQcComment] = useState('');

  const token = localStorage.getItem('adminToken');

  useEffect(() => { fetchOrders(); }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/admin/orders', { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) { setOrders(data.orders); } else { setError(data.message || 'Failed to fetch order list'); }
    } catch (err) { setError('Cannot connect to order service API'); } finally { setLoading(false); }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const res = await fetch(`http://localhost:5000/api/admin/orders/${orderId}/status`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ status: newStatus }) });
      const data = await res.json();
      if (data.success) { fetchOrders(); } else { alert(data.message || 'Error updating status'); }
    } catch (err) { alert('Network error'); }
  };

  const handleSimulateReturnRequest = async (orderId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/admin/orders/${orderId}/rma`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ rmaStatus: 'return_requested', reason: 'Incorrect size, T-shirt is too loose.' }) });
      const data = await res.json();
      if (data.success) { fetchOrders(); } else { alert(data.message || 'Error starting return simulator'); }
    } catch (err) { alert('Network error'); }
  };

  const handleSchedulePickup = async (orderId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/admin/orders/${orderId}/rma`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ rmaStatus: 'pickup_scheduled' }) });
      const data = await res.json();
      if (data.success) { fetchOrders(); }
    } catch (err) { alert('Network error'); }
  };

  const handleQcSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRmaOrder) return;
    const targetStatus = qcRating === 'passed' ? 'refunded' : 'rejected';
    try {
      const res = await fetch(`http://localhost:5000/api/admin/orders/${selectedRmaOrder._id}/rma`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ rmaStatus: targetStatus, qcStatus: qcRating, reason: qcComment || 'QC evaluation completed' }) });
      const data = await res.json();
      if (data.success) { setSelectedRmaOrder(null); setQcComment(''); fetchOrders(); } else { alert(data.message || 'Error processing QC evaluation'); }
    } catch (err) { alert('Network error'); }
  };

  const downloadCsv = async (endpoint, fileName) => {
    try {
      const res = await fetch(`http://localhost:5000/api/admin/export/${endpoint}`, { headers: { 'Authorization': `Bearer ${token}` } });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = fileName; document.body.appendChild(a); a.click(); a.remove();
    } catch (err) { alert('Failed to download CSV ledger'); }
  };

  const filteredOrders = orders.filter(o => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'returns') return o.rma && o.rma.status !== 'none';
    return o.status === filterStatus;
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">Fulfillment & RMA Console</h1>
          <p className="text-slate-500 text-sm mt-1">Manage courier manifests, track Shiprocket tracking, and process return pipelines.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button onClick={() => downloadCsv('orders', 'orders_ledger_export.csv')} className="px-4 py-2.5 rounded-xl border border-emerald-300 text-emerald-600 hover:bg-emerald-50 text-xs font-bold transition-all cursor-pointer flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            Export Orders Ledger
          </button>
          <button onClick={() => downloadCsv('financials', 'financials_splits_export.csv')} className="px-4 py-2.5 rounded-xl border border-indigo-300 text-indigo-600 hover:bg-indigo-50 text-xs font-bold transition-all cursor-pointer flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Export Financial Splits
          </button>
        </div>
      </div>

      <div className="flex gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        {[
          { key: 'all', label: 'All Orders' }, { key: 'pending', label: 'Pending Processing' },
          { key: 'manifested', label: 'Ready to Ship' }, { key: 'shipped', label: 'In Transit' },
          { key: 'delivered', label: 'Completed' }, { key: 'returns', label: 'RMA returns' },
          { key: 'cancelled', label: 'Cancelled' }
        ].map(tab => (
          <button key={tab.key} onClick={() => setFilterStatus(tab.key)}
            className={`px-4 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-colors cursor-pointer ${
              filterStatus === tab.key
                ? 'bg-white text-slate-900 border border-slate-200 shadow-sm'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
            }`}
          >{tab.label}</button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3].map(n => (<div key={n} className="h-24 bg-slate-200 border border-slate-200 rounded-3xl"></div>))}
        </div>
      ) : filteredOrders.length > 0 ? (
        <div className="space-y-4">
          {filteredOrders.map(order => (
            <div key={order._id} className="rounded-3xl border border-slate-200 bg-white p-6 hover:border-slate-300 transition-colors relative shadow-sm">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 pb-4 border-b border-slate-200 text-xs text-slate-400">
                <div>
                  <span className="font-semibold text-slate-600">ID:</span> <span className="font-mono">{order._id}</span>
                  <span className="mx-2">&bull;</span>
                  <span>{new Date(order.createdAt).toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-0.5 rounded-full font-bold uppercase text-[9px] border ${
                    order.status === 'delivered' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                    order.status === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                    order.status === 'manifested' ? 'bg-indigo-50 text-indigo-600 border-indigo-200' :
                    order.status === 'shipped' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                    order.status === 'returned' ? 'bg-red-50 text-red-600 border-red-200' :
                    'bg-slate-100 text-slate-500 border-slate-200'
                  }`}>{order.status}</span>
                  {order.rma && order.rma.status !== 'none' && (
                    <span className="px-2.5 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200 font-bold uppercase text-[9px]">
                      RMA: {order.rma.status.replace('_', ' ')}
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 py-6 items-start">
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ordered Products</h4>
                  <div className="space-y-2">
                    {order.cart?.map((item, index) => (
                      <div key={index} className="flex justify-between items-center text-xs">
                        <div><p className="font-semibold text-slate-800">{item.title}</p><p className="text-[10px] text-slate-500">Size: {item.size} | Color: {item.color || 'Standard'}</p></div>
                        <span className="text-slate-600 font-mono">₹{item.price} x{item.qty}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="text-xs space-y-1.5 border-l border-slate-200 pl-0 lg:pl-6">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Customer / Address</h4>
                  <p className="font-bold text-slate-800">{order.customer?.name}</p>
                  <p className="text-slate-500">Phone: {order.customer?.phone}</p>
                  <p className="text-slate-500 leading-relaxed truncate" title={order.customer?.address}>{order.customer?.address}</p>
                </div>
                <div className="text-xs space-y-1.5 border-l border-slate-200 pl-0 lg:pl-6 font-medium text-slate-500">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Tax Splits Ledger</h4>
                  <div className="flex justify-between"><span>Base Amount:</span><span className="font-mono text-slate-800">₹{order.baseAmount || 0}</span></div>
                  <div className="flex justify-between"><span>GST Slab (12%):</span><span className="font-mono text-slate-800">₹{order.taxAmount || 0}</span></div>
                  {order.couponDiscount > 0 && (
                    <div className="flex justify-between text-indigo-600"><span>Coupon Discount ({order.couponUsed}):</span><span className="font-mono">-₹{order.couponDiscount}</span></div>
                  )}
                  <div className="flex justify-between border-t border-slate-200 pt-1.5 font-extrabold text-slate-900">
                    <span>Paid Net:</span><span className="font-mono text-emerald-600">₹{order.amount}</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-4 flex flex-wrap gap-3 items-center justify-between">
                <div className="text-xs">
                  {order.awbCode ? (
                    <p className="text-slate-500">AWB Courier Tracking: <span className="font-mono font-bold text-indigo-600">{order.awbCode}</span></p>
                  ) : (
                    <p className="text-slate-400 italic">No courier tracking manifested yet.</p>
                  )}
                </div>
                <div className="flex gap-2">
                  {order.status === 'pending' && (<button onClick={() => updateOrderStatus(order._id, 'manifested')} className="px-3.5 py-1.5 rounded-lg bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-500 transition-colors cursor-pointer">Manifest Shiprocket Courier</button>)}
                  {order.status === 'manifested' && (<>
                    <button onClick={() => setSelectedLabelOrder(order)} className="px-3.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 text-xs font-bold transition-colors cursor-pointer">Print Shipping Label</button>
                    <button onClick={() => updateOrderStatus(order._id, 'shipped')} className="px-3.5 py-1.5 rounded-lg bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-500 transition-colors cursor-pointer">Ship Dispatch</button>
                  </>)}
                  {order.status === 'shipped' && (<button onClick={() => updateOrderStatus(order._id, 'delivered')} className="px-3.5 py-1.5 rounded-lg bg-emerald-500 text-white font-bold text-xs hover:bg-emerald-400 transition-colors cursor-pointer">Mark as Delivered</button>)}
                  {order.status === 'delivered' && order.rma?.status === 'none' && (<button onClick={() => handleSimulateReturnRequest(order._id)} className="px-3.5 py-1.5 rounded-lg border border-red-300 text-red-500 hover:bg-red-50 text-xs font-semibold transition-colors cursor-pointer">Simulate Return Request</button>)}
                  {order.rma && order.rma.status === 'return_requested' && (<button onClick={() => handleSchedulePickup(order._id)} className="px-3.5 py-1.5 rounded-lg bg-amber-600 text-white font-bold text-xs hover:bg-amber-500 transition-colors cursor-pointer">Schedule Return Pickup</button>)}
                  {order.rma && order.rma.status === 'pickup_scheduled' && (<button onClick={() => setSelectedRmaOrder(order)} className="px-3.5 py-1.5 rounded-lg bg-red-600 text-white font-bold text-xs hover:bg-red-500 transition-colors cursor-pointer">Evaluate Warehouse QC</button>)}
                  {order.rma && order.rma.status === 'refunded' && (<span className="text-[10px] text-emerald-600 font-bold">Refunded &bull; Txn: {order.rma.refundTxnId}</span>)}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="border border-slate-200 bg-white rounded-3xl py-16 text-center text-slate-500 text-sm shadow-sm">No orders found matching the filter criteria.</div>
      )}

      {/* Shipping Label Modal */}
      {selectedLabelOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white text-slate-950 rounded-3xl max-w-lg w-full p-8 relative shadow-2xl font-mono">
            <button onClick={() => setSelectedLabelOrder(null)} className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 text-slate-500 transition-colors cursor-pointer">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <div className="border-4 border-slate-950 p-6 space-y-4">
              <div className="flex justify-between items-start border-b-2 border-slate-950 pb-4">
                <div><h3 className="font-extrabold text-lg">SHIPROCKET EXPRESS</h3><p className="text-[10px] text-slate-600 mt-1">Delhivery surface logistics partner</p></div>
                <div className="text-right"><span className="font-black text-xl bg-slate-950 text-white px-2 py-0.5 rounded">COD</span></div>
              </div>
              <div className="flex flex-col items-center justify-center border-b-2 border-slate-950 py-4 space-y-1">
                <div className="h-14 w-full bg-slate-950 flex gap-[2px] items-stretch px-6">
                  {[3,1,4,2,5,1,3,2,4,1,2,5,3,1,4,2,3,1,5,2,4,1,3,2,4,5,1,2,3,1,4,2,3].map((w, i) => (<div key={i} className="bg-white flex-1" style={{ marginRight: `${w}px` }}></div>))}
                </div>
                <span className="text-xs font-bold tracking-[0.2em]">{selectedLabelOrder.awbCode}</span>
              </div>
              <div className="grid grid-cols-2 gap-4 border-b-2 border-slate-950 pb-4 text-[10px]">
                <div><h5 className="font-black uppercase text-[9px] text-slate-500">Deliver To:</h5><p className="font-bold mt-1 text-xs">{selectedLabelOrder.customer?.name}</p><p className="text-slate-700 leading-tight mt-1">{selectedLabelOrder.customer?.address}</p><p className="text-slate-700 mt-1 font-bold">Phone: {selectedLabelOrder.customer?.phone}</p></div>
                <div className="border-l-2 border-slate-950 pl-4"><h5 className="font-black uppercase text-[9px] text-slate-500">Shipped By:</h5><p className="font-bold mt-1 text-xs">THREADLAB LTD.</p><p className="text-slate-700 leading-tight mt-1">Warehouse Sector 4, Bangalore, India</p><p className="text-slate-700 mt-1 font-bold">GSTIN: 29AABCX1209B1ZN</p></div>
              </div>
              <div className="flex justify-between items-center text-[10px] pt-2">
                <div><p className="text-slate-500 font-bold uppercase">Weight</p><p className="font-bold text-xs mt-0.5">0.32 Kg (1 Apparel)</p></div>
                <div className="text-right"><p className="text-slate-500 font-bold uppercase">Net Value</p><p className="font-bold text-xs mt-0.5">₹{selectedLabelOrder.amount} (Collect Cash)</p></div>
              </div>
            </div>
            <button onClick={() => window.print()} className="w-full mt-6 py-2.5 bg-slate-950 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer">Print Manifest Receipt</button>
          </div>
        </div>
      )}

      {/* QC Evaluation Modal */}
      {selectedRmaOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-8 relative shadow-2xl text-slate-800">
            <button onClick={() => setSelectedRmaOrder(null)} className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 text-slate-400 transition-colors cursor-pointer">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <h3 className="text-lg font-bold text-slate-900 mb-6">Warehouse Quality Check (QC)</h3>
            <div className="mb-4 text-xs text-slate-500">
              <span className="font-bold text-slate-700">Item to Evaluate:</span>
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 mt-2 space-y-1 text-[11px]">
                {selectedRmaOrder.cart?.map((item, index) => (<p key={index} className="text-slate-700 font-semibold">{item.title} (Size: {item.size}) x{item.qty}</p>))}
                <p className="text-red-500 mt-2 font-medium">Customer Reason: "{selectedRmaOrder.rma?.reason}"</p>
              </div>
            </div>
            <form onSubmit={handleQcSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">QC Decision</label>
                <div className="grid grid-cols-2 gap-4">
                  <label className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-sm font-semibold cursor-pointer transition-all ${qcRating === 'passed' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'}`}>
                    <input type="radio" name="qc" value="passed" checked={qcRating === 'passed'} onChange={() => setQcRating('passed')} className="hidden" />
                    <span>Passed (Replenish & Refund)</span>
                  </label>
                  <label className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-sm font-semibold cursor-pointer transition-all ${qcRating === 'failed' ? 'border-red-500 bg-red-50 text-red-700' : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'}`}>
                    <input type="radio" name="qc" value="failed" checked={qcRating === 'failed'} onChange={() => setQcRating('failed')} className="hidden" />
                    <span>Failed (Reject RMA)</span>
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">QC Evaluator Comments</label>
                <textarea rows="3" value={qcComment} onChange={(e) => setQcComment(e.target.value)} className="block w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 text-sm focus:border-indigo-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20" placeholder="Apparel received in original tag, fold condition matches reseller standards..." />
              </div>
              <div className="flex gap-4 pt-4 border-t border-slate-200">
                <button type="button" onClick={() => setSelectedRmaOrder(null)} className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-50 text-xs font-semibold transition-colors cursor-pointer">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors cursor-pointer shadow-md shadow-indigo-500/20">Finalize RMA Record</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
