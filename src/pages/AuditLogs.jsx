import React, { useState, useMemo, useEffect } from 'react';
import { ShieldCheck, Search, HelpCircle, Activity, RefreshCw, AlertTriangle, WifiOff } from 'lucide-react';
import AuditLogTimeline from '../components/AuditLogTimeline';
import axiosInstance from '../api/axiosInstance';
import { useTheme } from '../context/ThemeContext';

const AuditLogs = () => {
  const { density } = useTheme();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    let isMounted = true;
    const fetchAuditLogs = async () => {
      try {
        setLoading(true);
        setErrorMsg('');
        setIsOffline(false);

        const response = await axiosInstance.get('/api/v1/data/audit-logs');

        if (isMounted && response.data) {
          console.log('[AuditLogs] Successfully retrieved from DynamoDB:', response.data);
          // Sort logs so newest is first based on timestamp
          const sorted = (response.data.data || []).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
          setLogs(sorted);
        }
      } catch (error) {
        console.warn(`[AuditLogs API Error] /api/v1/data/audit-logs failed.`, error.message);
        if (isMounted) {
          setIsOffline(true);
          setErrorMsg(`Failed to connect to backend: ${error.message}`);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchAuditLogs();

    return () => { isMounted = false; };
  }, []);

  const filteredLogs = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return logs;
    return logs.filter(log => 
      (log.category || '').toLowerCase().includes(query) ||
      (log.description || '').toLowerCase().includes(query) ||
      (log.ipAddress || '').toLowerCase().includes(query) ||
      (log.logId || '').toLowerCase().includes(query) ||
      (log.action || '').toLowerCase().includes(query)
    );
  }, [searchQuery, logs]);

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Audit & Activity Logs</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Immutable trail of administrative and systemic changes.</p>
        </div>

        <div className="flex items-center gap-3">
          {isOffline && (
            <div className="flex items-center gap-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 px-3.5 py-2 text-xs font-bold text-amber-700 dark:text-amber-500 border border-amber-100/50 dark:border-amber-900/40 shadow-xs">
              <WifiOff className="h-4 w-4 shrink-0" />
              <span>Offline</span>
            </div>
          )}
          <div className="flex items-center gap-2 rounded-xl bg-violet-50 dark:bg-violet-950/30 px-4 py-2 text-xs font-bold text-violet-700 dark:text-violet-400 border border-violet-100 dark:border-violet-900/40 shadow-sm">
            <Activity className="h-4 w-4 shrink-0 text-violet-600 dark:text-violet-500 animate-pulse" />
            <span>Total Traced: {logs.length} Events</span>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 rounded-xl bg-white dark:bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Network Alert Notification */}
      {errorMsg && (
        <div className="flex items-start gap-3 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 p-4 text-xs font-semibold text-rose-700 dark:text-rose-450">
          <AlertTriangle className="h-4.5 w-4.5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-extrabold block">Network Communication Warning</span>
            <p className="mt-0.5 text-rose-600 dark:text-rose-450 font-medium">{errorMsg}</p>
          </div>
        </div>
      )}

      {/* Filter and Search Panel */}
      <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1 max-w-lg">
          <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Search logs by keyword, IP, category, or log ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 py-3 pl-10 pr-4 text-sm text-slate-700 dark:text-slate-300 placeholder-slate-400 dark:placeholder-slate-600 outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-violet-500 dark:focus:border-violet-500 transition-all"
          />
        </div>
        
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 dark:text-slate-500">
          <HelpCircle className="h-4 w-4 text-slate-300 dark:text-slate-600" />
          <span>Showing {filteredLogs.length} of {logs.length} items</span>
        </div>
      </div>

      {/* Timeline component mapping */}
      <div className="pt-2">
        {loading ? (
          <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-6 text-center text-slate-500">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-violet-500" />
            <p className="text-sm font-semibold">Loading audit logs from AWS DynamoDB...</p>
          </div>
        ) : filteredLogs.length > 0 ? (
          <AuditLogTimeline logs={filteredLogs} />
        ) : (
          <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-10 text-center flex flex-col items-center">
            <ShieldCheck className="h-10 w-10 text-slate-300 dark:text-slate-700 mb-3" />
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">No Logs Found</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mt-1">
              Either there are no audit logs matching your search, or the DynamoDB table is empty.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditLogs;
