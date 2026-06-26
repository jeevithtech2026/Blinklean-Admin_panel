import React from 'react';
import { Shield, Key, FileSpreadsheet, Filter, AlertTriangle, Terminal } from 'lucide-react';

const AuditLogTimeline = ({ logs }) => {
  if (!logs || !logs.length) {
    return (
      <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-100 rounded-2xl bg-white p-12 text-center">
        <Shield className="h-10 w-10 text-slate-300 mb-3" />
        <h3 className="text-sm font-bold text-slate-800">No log entries recorded</h3>
        <p className="text-xs text-slate-500 mt-1">No system events matched your current search filters.</p>
      </div>
    );
  }

  // Helper to resolve severity-based styling and icons
  const getCategoryDetails = (category) => {
    switch (category?.toUpperCase()) {
      case 'AUTH_SUCCESS':
        return {
          badge: 'bg-emerald-50 border-emerald-100 text-emerald-700',
          iconColor: 'bg-emerald-500 text-white',
          Icon: Key,
        };
      case 'AUTH_FAIL':
        return {
          badge: 'bg-rose-50 border-rose-100 text-rose-700',
          iconColor: 'bg-rose-500 text-white',
          Icon: AlertTriangle,
        };
      case 'EXPORT':
        return {
          badge: 'bg-amber-50 border-amber-100 text-amber-700',
          iconColor: 'bg-amber-500 text-white',
          Icon: FileSpreadsheet,
        };
      case 'FILTER':
        return {
          badge: 'bg-blue-50 border-blue-100 text-blue-700',
          iconColor: 'bg-blue-500 text-white',
          Icon: Filter,
        };
      default:
        return {
          badge: 'bg-slate-50 border-slate-100 text-slate-700',
          iconColor: 'bg-slate-500 text-white',
          Icon: Terminal,
        };
    }
  };

  return (
    <div className="relative border-l-2 border-slate-100 ml-4 md:ml-6 pl-6 space-y-8">
      {logs.map((log) => {
        const { badge, iconColor, Icon } = getCategoryDetails(log.category);
        return (
          <div key={log.id} className="relative group">
            {/* Timeline icon dot */}
            <span className={`absolute -left-[35px] md:-left-[43px] top-1.5 flex h-7 w-7 md:h-8 md:w-8 items-center justify-center rounded-xl shadow-md border-2 border-white transition-transform group-hover:scale-110 ${iconColor}`}>
              <Icon className="h-3.5 w-3.5 md:h-4 md:w-4" />
            </span>

            {/* Content card */}
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs transition-all hover:shadow-sm">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-lg border ${badge}`}>
                    {log.category}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400">
                    {new Date(log.timestamp).toLocaleString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </span>
                </div>
                <div className="text-[10px] font-mono text-slate-400 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-md self-start sm:self-auto">
                  ID: {log.id}
                </div>
              </div>

              <p className="text-sm font-semibold text-slate-800 leading-relaxed mb-4">
                {log.description}
              </p>

              {/* IP / User Agent metadata footer */}
              <div className="grid gap-2 sm:grid-cols-2 text-[10px] text-slate-400 border-t border-slate-50 pt-3">
                <div className="flex items-center gap-1.5 font-semibold">
                  <span className="text-slate-300">Client IP:</span>
                  <span className="font-mono text-slate-500">{log.ipAddress}</span>
                </div>
                <div className="flex items-center gap-1.5 truncate font-semibold">
                  <span className="text-slate-300">User Agent:</span>
                  <span className="truncate text-slate-500" title={log.userAgent}>{log.userAgent}</span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AuditLogTimeline;
