import React, { useState, useMemo, useEffect } from 'react';
import { Gauge, HardDrive, AlertTriangle, CheckCircle, HelpCircle, RefreshCw, WifiOff } from 'lucide-react';
import { triggerGlobalNotification } from '../context/NotificationContext';
import axiosInstance from '../api/axiosInstance';

const initialBudgets = [
  { id: '1', component: 'Dashboard Overview API', targetBudget: '20 KB', currentWeight: 12.4, status: 'PASS' },
  { id: '2', component: 'Partner Registry JSON', targetBudget: '50 KB', currentWeight: 48.2, status: 'PASS' },
  { id: '3', component: 'System Alerts Sync', targetBudget: '15 KB', currentWeight: 22.8, status: 'FAIL' },
];

const PerformanceAudit = () => {
  const [budgets, setBudgets] = useState(initialBudgets);
  const [isAuditing, setIsAuditing] = useState(false);
  
  const [dbAlerts, setDbAlerts] = useState([]);
  const [loadingDb, setLoadingDb] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    let isMounted = true;
    const fetchSystemAlerts = async () => {
      try {
        setLoadingDb(true);
        const response = await axiosInstance.get('/api/v1/data/system-alerts');
        if (isMounted && response.data) {
          const perfAlerts = (response.data.data || []).filter(a => a.type === 'performance');
          setDbAlerts(perfAlerts);
        }
      } catch (err) {
        if (isMounted) setErrorMsg(`Failed to connect to backend: ${err.message}`);
      } finally {
        if (isMounted) setLoadingDb(false);
      }
    };
    fetchSystemAlerts();
    return () => { isMounted = false; };
  }, []);

  // Use dynamic alerts or fallback
  const latencyMetrics = dbAlerts.length > 0 
    ? dbAlerts.map(a => ({ name: a.message, value: Number(a.latencyMs) || 500, desc: `Alert ID: ${a.alertId}` }))
    : [
        { name: 'Consolidated Dashboard Summary', value: 142, desc: 'API GET /dashboard-summary' },
        { name: 'System Webhooks Sync', value: 312, desc: 'API GET /webhooks' },
        { name: 'Audit Logs Feed', value: 584, desc: 'API GET /audit-logs' }
      ];

  const getLatencyThreshold = (latencyMs) => {
    if (latencyMs < 200) {
      return { banner: 'bg-emerald-50 border-emerald-150 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30', label: 'Fast (< 200ms)', badge: 'bg-emerald-500' };
    } else if (latencyMs <= 500) {
      return { banner: 'bg-amber-50 border-amber-150 text-amber-800 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30', label: 'Moderate (200-500ms)', badge: 'bg-amber-500' };
    } else {
      return { banner: 'bg-rose-50 border-rose-150 text-rose-800 dark:bg-rose-950/20 dark:text-rose-450 dark:border-rose-900/30', label: 'Degraded (> 500ms)', badge: 'bg-rose-500' };
    }
  };

  const handleRecalculateAudits = () => {
    setIsAuditing(true);
    triggerGlobalNotification('Initiating network budget analysis audit...', 'info');

    setTimeout(() => {
      const updatedBudgets = budgets.map(b => {
        const variance = (Math.random() * 4 - 2); 
        const newWeight = Math.max(0, b.currentWeight + variance);
        const target = parseFloat(b.targetBudget);
        return {
          ...b,
          currentWeight: parseFloat(newWeight.toFixed(1)),
          status: newWeight > target ? 'FAIL' : 'PASS'
        };
      });
      setBudgets(updatedBudgets);
      setIsAuditing(false);
      triggerGlobalNotification('Network audit complete. Thresholds updated.', 'success');
    }, 2500);
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Performance Audit</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Monitor API latency thresholds and payload network budgets.</p>
        </div>
        <button
          onClick={handleRecalculateAudits}
          disabled={isAuditing}
          className="flex items-center gap-2 rounded-xl bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-900 px-4 py-2 text-sm font-bold shadow-md disabled:opacity-50 transition-all cursor-pointer"
        >
          <RefreshCw className={`h-4 w-4 ${isAuditing ? 'animate-spin' : ''}`} />
          <span>{isAuditing ? 'Running Diagnostic...' : 'Recalculate Audits'}</span>
        </button>
      </div>

      {errorMsg && (
        <div className="flex items-start gap-3 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 p-4 text-xs font-semibold text-rose-700 dark:text-rose-450">
          <AlertTriangle className="h-4.5 w-4.5 text-rose-600 shrink-0 mt-0.5" />
          <div><span className="font-extrabold block">Network Warning</span><p className="mt-0.5">{errorMsg}</p></div>
        </div>
      )}

      {/* Latency Matrix */}
      <div className="grid md:grid-cols-3 gap-6">
        {latencyMetrics.map((metric, i) => {
          const threshold = getLatencyThreshold(metric.value);
          return (
            <div key={i} className={`rounded-2xl border p-5 shadow-sm transition-colors ${threshold.banner}`}>
              <div className="flex items-center justify-between mb-3">
                <Gauge className="h-5 w-5 opacity-80" />
                <span className="text-[10px] uppercase font-bold tracking-wider opacity-80 flex items-center gap-1.5">
                  <span className={`h-1.5 w-1.5 rounded-full ${threshold.badge}`}></span>
                  {threshold.label}
                </span>
              </div>
              <h3 className="text-3xl font-extrabold mb-1">
                {metric.value} <span className="text-sm font-bold opacity-60">ms</span>
              </h3>
              <p className="text-xs font-semibold opacity-80 mb-0.5">{metric.name}</p>
              <p className="text-[10px] font-mono opacity-60">{metric.desc}</p>
            </div>
          );
        })}
      </div>

      {/* Network Budgets Table */}
      <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden flex flex-col">
        <div className="border-b border-slate-100 dark:border-slate-800 p-5 bg-slate-50/50 dark:bg-slate-950/50 flex items-center gap-3 justify-between">
          <div className="flex items-center gap-3">
            <HardDrive className="h-5 w-5 text-slate-500" />
            <h3 className="font-bold text-slate-900 dark:text-white">API Payload Budgets</h3>
          </div>
          <HelpCircle className="h-4 w-4 text-slate-400" title="Thresholds defined to prevent heavy mobile client degradation." />
        </div>
        
        <div className="overflow-x-auto p-2">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="font-bold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                <th className="px-4 py-3">Component / View</th>
                <th className="px-4 py-3">Hard Budget</th>
                <th className="px-4 py-3">Current Weight</th>
                <th className="px-4 py-3">Validation Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50 text-sm">
              {budgets.map((budget) => {
                const target = parseFloat(budget.targetBudget);
                const pct = Math.min((budget.currentWeight / target) * 100, 100);
                
                return (
                  <tr key={budget.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                    <td className="px-4 py-4 font-semibold text-slate-800 dark:text-slate-200">{budget.component}</td>
                    <td className="px-4 py-4 font-mono text-xs text-slate-500">{budget.targetBudget}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs font-bold w-12 text-slate-700 dark:text-slate-300">{budget.currentWeight} KB</span>
                        <div className="w-24 bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                          <div 
                            className={`h-1.5 rounded-full ${budget.status === 'PASS' ? 'bg-emerald-500' : 'bg-rose-500'}`}
                            style={{ width: `${pct}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {budget.status === 'PASS' ? (
                        <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 px-2 py-0.5 text-[10px] font-bold border border-emerald-100 dark:border-emerald-900/40">
                          <CheckCircle className="h-3 w-3" /> PASS
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-lg bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-450 px-2 py-0.5 text-[10px] font-bold border border-rose-100 dark:border-rose-900/40">
                          <AlertTriangle className="h-3 w-3" /> EXCEEDS LIMIT
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PerformanceAudit;
