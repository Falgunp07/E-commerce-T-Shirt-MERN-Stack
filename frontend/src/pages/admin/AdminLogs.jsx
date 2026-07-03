import { useEffect, useState } from 'react';

export default function AdminLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedLogId, setExpandedLogId] = useState(null);

  const token = localStorage.getItem('adminToken');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/admin/logs', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setLogs(data.logs || []);
      } else {
        setError(data.message || 'Failed to fetch audit trails');
      }
    } catch (err) {
      setError('Cannot connect to security log service API');
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-red-500/10 text-red-600 border-red-500/20';
      case 'logistics_manager':
        return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      case 'catalog_manager':
        return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      default:
        return 'bg-slate-500/10 text-slate-600 border-slate-500/20';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">Security & Audit Trails</h1>
          <p className="text-slate-500 text-sm mt-1">Immutable streaming console of all administrative database modifications.</p>
        </div>
        <button
          onClick={fetchLogs}
          className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer shadow-sm"
          title="Refresh Logs"
        >
          <svg className="w-5 h-5 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H18" />
          </svg>
        </button>
      </div>

      {/* Audit Stream Console */}
      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3].map(n => (
            <div key={n} className="h-16 bg-slate-200 border border-slate-200 rounded-2xl"></div>
          ))}
        </div>
      ) : error ? (
        <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-6 text-red-600">{error}</div>
      ) : logs.length > 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4 max-h-[70vh] overflow-y-auto pr-2">
          {logs.map((log) => {
            const isExpanded = expandedLogId === log._id;
            return (
              <div
                key={log._id}
                className="rounded-2xl border border-slate-100 bg-slate-50 p-4 transition-colors hover:border-slate-200"
              >
                {/* Summary Row */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Timestamp */}
                    <span className="font-mono text-slate-400">
                      [{new Date(log.timestamp).toLocaleTimeString()}]
                    </span>
                    
                    {/* User Profile */}
                    <span className="font-bold text-slate-800">{log.userName}</span>
                    
                    {/* User Role Badge */}
                    <span className={`px-2 py-0.5 rounded-full border text-[9px] font-black uppercase ${getRoleBadgeColor(log.userRole)}`}>
                      {log.userRole?.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-auto text-slate-400">
                    <span className="font-mono text-[10px]">IP: {log.clientIp}</span>
                    {log.payload && (
                      <button
                        onClick={() => setExpandedLogId(isExpanded ? null : log._id)}
                        className="text-indigo-600 hover:text-indigo-500 font-semibold cursor-pointer text-xs flex items-center gap-1"
                      >
                        {isExpanded ? 'Hide Payload' : 'Inspect Details'}
                        <svg className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>

                {/* Action log sentence */}
                <p className="mt-3 text-xs text-slate-700 font-medium leading-relaxed pl-0 sm:pl-[66px]">
                  {log.action}
                </p>

                {/* Expanded Payload Viewer */}
                {isExpanded && log.payload && (
                  <div className="mt-4 pt-4 border-t border-slate-200 pl-0 sm:pl-[66px] animate-fadeIn">
                    <div className="bg-white border border-slate-200 rounded-xl p-4 overflow-x-auto shadow-sm">
                      <pre className="text-[10px] text-slate-600 font-mono leading-relaxed max-w-full">
                        {JSON.stringify(log.payload, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}

              </div>
            );
          })}
        </div>
      ) : (
        <div className="border border-slate-200 bg-white rounded-3xl py-16 text-center text-slate-500 text-sm shadow-sm">
          No audit entries logged yet. Database actions will populate this timeline.
        </div>
      )}
    </div>
  );
}
