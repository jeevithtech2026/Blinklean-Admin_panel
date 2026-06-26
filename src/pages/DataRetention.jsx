import React, { useState, useMemo } from 'react';
import { Archive, Trash2, ShieldAlert, CheckCircle, Loader2, Play } from 'lucide-react';
import { triggerGlobalNotification } from '../context/NotificationContext';

const initialHistory = [
  { id: 'TTL-001', date: new Date().toISOString().split('T')[0], policy: 'DynamoDB TTL Cleanup (AuditLogs)', count: 'Auto-Purge', space: '~', status: 'CONTINUOUS' },
  { id: 'TTL-002', date: new Date().toISOString().split('T')[0], policy: 'DynamoDB TTL Cleanup (SystemAlerts)', count: 'Auto-Purge', space: '~', status: 'CONTINUOUS' }
];

const DataRetention = () => {
  const [history, setHistory] = useState(initialHistory);
  const [logsRetention, setLogsRetention] = useState('30 Days');
  const [bookingsRetention, setBookingsRetention] = useState('Indefinite');
  const [auditsRetention, setAuditsRetention] = useState('90 Days');

  // Purge Confirmation States
  const [understand, setUnderstand] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [purgeTarget, setPurgeTarget] = useState('AuditLogs (DynamoDB)');
  const [isPurging, setIsPurging] = useState(false);
  const [progress, setProgress] = useState(0);

  // Validate if the button can be triggered
  const isPurgeEnabled = understand && confirmText === 'PURGE' && !isPurging;

  const handleExecutePurge = (e) => {
    e.preventDefault();
    if (!isPurgeEnabled) return;

    setIsPurging(true);
    setProgress(0);

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);

          // Add execution record on completion
          const newJob = {
            id: `MANUAL-${Math.floor(Math.random()*1000)}`,
            date: new Date().toISOString().split('T')[0],
            policy: `Manual Purge of ${purgeTarget}`,
            count: 'Processing...',
            space: 'N/A',
            status: 'COMPLETED'
          };

          setHistory((prev) => [newJob, ...prev]);
          setIsPurging(false);
          setUnderstand(false);
          setConfirmText('');
          triggerGlobalNotification(`Manual destructive purge initiated on ${purgeTarget}.`, 'success');
          return 0;
        }
        return prev + 25; // 25% increments
      });
    }, 500);
  };

  const handleUpdatePolicies = () => {
    triggerGlobalNotification('Retention policies updated in AWS DynamoDB configurations.', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Data Retention Policies</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Manage automated DynamoDB Time-to-Live (TTL) expiration and manual data purge actions.</p>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-violet-50 dark:bg-violet-950/30 px-4 py-2 text-xs font-bold text-violet-700 dark:text-violet-400 border border-violet-100 dark:border-violet-900/40 shadow-sm">
          <CheckCircle className="h-4 w-4 shrink-0 text-violet-600 dark:text-violet-500" />
          <span>DynamoDB TTL Active</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Retention Configurations */}
        <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-6 flex flex-col h-max">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">TTL Policies</h2>
            <p className="text-xs text-slate-400 dark:text-slate-500">Define how long historical records live in DynamoDB before being auto-deleted by AWS at no cost.</p>
          </div>

          <div className="space-y-5">
            <div className="space-y-1.5 border-b border-slate-100 dark:border-slate-800 pb-4">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Audit Logs (System Admin)</label>
              <select 
                value={logsRetention}
                onChange={(e) => setLogsRetention(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 px-3.5 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 outline-none focus:bg-white focus:border-violet-500 cursor-pointer"
              >
                <option value="30 Days">30 Days</option>
                <option value="90 Days">90 Days</option>
                <option value="6 Months">6 Months</option>
                <option value="1 Year">1 Year</option>
              </select>
            </div>

            <div className="space-y-1.5 border-b border-slate-100 dark:border-slate-800 pb-4">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Service Bookings (Historical)</label>
              <select 
                value={bookingsRetention}
                onChange={(e) => setBookingsRetention(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 px-3.5 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 outline-none focus:bg-white focus:border-violet-500 cursor-pointer"
              >
                <option value="1 Year">1 Year</option>
                <option value="5 Years">5 Years</option>
                <option value="Indefinite">Indefinite (Never Delete)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Security & Performance Alerts</label>
              <select 
                value={auditsRetention}
                onChange={(e) => setAuditsRetention(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 px-3.5 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 outline-none focus:bg-white focus:border-violet-500 cursor-pointer"
              >
                <option value="30 Days">30 Days</option>
                <option value="90 Days">90 Days</option>
                <option value="6 Months">6 Months</option>
              </select>
            </div>
            
            <button
              onClick={handleUpdatePolicies}
              className="mt-2 w-full flex items-center justify-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 text-sm font-bold shadow-md transition-all cursor-pointer"
            >
              Update TTL Configurations
            </button>
          </div>
        </div>

        {/* Destructive Manual Purge */}
        <div className="rounded-2xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/30 dark:bg-rose-950/20 p-6 shadow-sm flex flex-col h-max relative overflow-hidden">
          {/* Danger Strip Pattern overlay */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05]" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #000 0, #000 10px, transparent 10px, transparent 20px)' }}></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <ShieldAlert className="h-5 w-5 text-rose-600 dark:text-rose-500" />
              <h2 className="text-base font-bold text-rose-900 dark:text-rose-400">Emergency Manual Purge</h2>
            </div>
            <p className="text-xs text-rose-700 dark:text-rose-450 mb-6 font-semibold leading-relaxed">
              WARNING: This action forcibly deletes records from DynamoDB bypassing TTL limits. Data cannot be recovered without a PITR restoration point.
            </p>

            <form onSubmit={handleExecutePurge} className="space-y-4 bg-white dark:bg-slate-900 p-5 rounded-xl border border-rose-100 dark:border-rose-900/40">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Target Resource</label>
                <select 
                  value={purgeTarget}
                  onChange={(e) => setPurgeTarget(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 px-3.5 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 outline-none focus:bg-white focus:border-rose-500 cursor-pointer"
                >
                  <option value="AuditLogs (DynamoDB)">AuditLogs (All Records)</option>
                  <option value="SystemAlerts (DynamoDB)">SystemAlerts (All Records)</option>
                  <option value="Webhooks (DynamoDB)">Webhooks (All Endpoints)</option>
                </select>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <label className="flex items-center gap-3 cursor-pointer group mb-4">
                  <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors ${understand ? 'border-rose-500 bg-rose-500' : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'}`}>
                    {understand && <CheckCircle className="h-3.5 w-3.5 text-white" />}
                  </div>
                  <input type="checkbox" className="hidden" checked={understand} onChange={() => setUnderstand(!understand)} />
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">I understand this will permanently drop records from the table.</span>
                </label>

                {understand && (
                  <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Type 'PURGE' to confirm</label>
                    <input 
                      type="text" 
                      placeholder="PURGE"
                      value={confirmText}
                      onChange={(e) => setConfirmText(e.target.value)}
                      className="w-full rounded-lg border border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/20 px-3.5 py-2.5 text-sm font-mono font-bold text-rose-700 dark:text-rose-400 placeholder-rose-300 dark:placeholder-rose-800/50 outline-none focus:border-rose-500 transition-all text-center"
                    />
                  </div>
                )}
              </div>

              {isPurging && (
                <div className="pt-2 pb-1">
                  <div className="flex items-center justify-between text-xs font-bold text-rose-700 dark:text-rose-450 mb-1">
                    <span>Executing Delete...</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-rose-600 h-2 rounded-full transition-all duration-300 ease-out" 
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={!isPurgeEnabled}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white px-4 py-3 text-sm font-extrabold shadow-md disabled:opacity-50 disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:text-slate-500 dark:disabled:text-slate-500 transition-all cursor-pointer mt-4"
              >
                {isPurging ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                <span>{isPurging ? 'Deleting Records...' : 'Execute Destructive Purge'}</span>
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* History Log */}
      <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden flex flex-col mt-6">
        <div className="border-b border-slate-100 dark:border-slate-800 p-5 bg-slate-50/50 dark:bg-slate-950/50 flex items-center gap-3">
          <Archive className="h-5 w-5 text-slate-500" />
          <h3 className="font-bold text-slate-900 dark:text-white">Retention & Purge Activity</h3>
        </div>
        
        <div className="overflow-x-auto p-2">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="font-bold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                <th className="px-4 py-3">Job ID</th>
                <th className="px-4 py-3">Execution Date</th>
                <th className="px-4 py-3">Policy / Target</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50 text-sm">
              {history.map((job) => (
                <tr key={job.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                  <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">{job.id}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400 font-mono text-xs">{job.date}</td>
                  <td className="px-4 py-3"><span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{job.policy}</span></td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 px-2 py-0.5 text-[10px] font-bold border border-emerald-100 dark:border-emerald-900/40">
                      <CheckCircle className="h-3 w-3" /> {job.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DataRetention;
