import { useEffect, useState, useMemo } from 'react';
import { API_BASE_URL } from '../../config/api';

export default function AdminLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedLogId, setExpandedLogId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const token = localStorage.getItem('adminToken');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/logs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setLogs(data.logs || []);
      } else {
        setError(data.message || 'Failed to fetch audit trails');
      }
    } catch {
      setError('Cannot connect to security log service API');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCsv = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/export/logs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch {
      alert('Failed to download audit logs CSV.');
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

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesRole = roleFilter === 'all' || log.userRole === roleFilter;
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        (log.userName && log.userName.toLowerCase().includes(query)) ||
        (log.action && log.action.toLowerCase().includes(query)) ||
        (log.clientIp && log.clientIp.toLowerCase().includes(query));
      return matchesRole && matchesSearch;
    });
  }, [logs, roleFilter, searchQuery]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">Security & Audit Trails</h1>
          <p className="text-slate-500 text-sm mt-1">Immutable streaming console of all administrative modifications with full timestamps.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCsv}
            className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer shadow-sm flex items-center gap-2"
          >
            <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export CSV
          </button>
          <button
            onClick={fetchLogs}
            className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer shadow-sm"
            title="Refresh Logs"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H18" />
            </svg>
          </button>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="w-full sm:w-80">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search action, user, or IP..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-900 outline-none focus:border-indigo-500 focus:bg-white"
          />
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <span className="text-xs text-slate-500 font-semibold">Filter Role:</span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 font-medium outline-none focus:border-indigo-500"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="logistics_manager">Logistics Manager</option>
            <option value="catalog_manager">Catalog Manager</option>
          </select>
          <span className="text-xs text-slate-400 font-mono">({filteredLogs.length} events)</span>
        </div>
      </div>

      {/* Audit Stream Console */}
      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-16 bg-slate-200 border border-slate-200 rounded-2xl"></div>
          ))}
        </div>
      ) : error ? (
        <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-6 text-red-600">{error}</div>
      ) : filteredLogs.length > 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4 max-h-[72vh] overflow-y-auto pr-2">
          {filteredLogs.map((log) => {
            const isExpanded = expandedLogId === log._id;
            const logDate = new Date(log.timestamp);
            const formattedDate = !isNaN(logDate.getTime())
              ? `${logDate.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })} • ${logDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`
              : 'Unknown Date';

            return (
              <div
                key={log._id}
                className="rounded-2xl border border-slate-100 bg-slate-50 p-4 transition-colors hover:border-slate-200"
              >
                {/* Summary Row */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Timestamp with Date AND Time */}
                    <span className="font-mono text-slate-700 bg-white px-2.5 py-1 rounded-md text-[11px] font-semibold border border-slate-200 shadow-2xs">
                      📅 {formattedDate}
                    </span>

                    {/* User Profile */}
                    <span className="font-bold text-slate-800 ml-1">{log.userName}</span>

                    {/* User Role Badge */}
                    <span
                      className={`px-2 py-0.5 rounded-full border text-[9px] font-black uppercase ${getRoleBadgeColor(
                        log.userRole
                      )}`}
                    >
                      {log.userRole?.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-auto text-slate-400">
                    <span className="font-mono text-[10px] bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      IP: {log.clientIp}
                    </span>
                    {log.payload && Object.keys(log.payload).length > 0 && (
                      <button
                        onClick={() => setExpandedLogId(isExpanded ? null : log._id)}
                        className="text-indigo-600 hover:text-indigo-500 font-semibold cursor-pointer text-xs flex items-center gap-1"
                      >
                        {isExpanded ? 'Hide Payload' : 'Inspect Details'}
                        <svg
                          className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="2.5"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>

                {/* Primary Action description */}
                <div className="mt-2 text-sm font-semibold text-slate-800 flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 inline-block"></span>
                  {log.action}
                </div>

                {/* Expanded Payload Inspector */}
                {isExpanded && log.payload && (
                  <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-slate-900 p-4 font-mono text-[11px] text-slate-200 shadow-inner">
                    <div className="mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex justify-between">
                      <span>Event Mutation Payload</span>
                      <span className="text-slate-500">ID: {log._id}</span>
                    </div>
                    <pre className="overflow-x-auto whitespace-pre-wrap leading-relaxed">
                      {JSON.stringify(log.payload, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="border border-slate-200 bg-white rounded-3xl py-16 text-center text-slate-400 text-sm shadow-sm">
          No audit log entries matching your search.
        </div>
      )}
    </div>
  );
}
