import React, { useState, useMemo } from 'react';
import { Database, Shield, ShieldCheck, Play, Loader2, Search, CheckCircle, AlertTriangle } from 'lucide-react';
import { triggerGlobalNotification } from '../context/NotificationContext';

const initialSnapshots = [
  { id: 'PITR-001', db: 'Users (DynamoDB)', timestamp: new Date().toISOString(), size: 'Auto-Scaling', encrypted: true, reason: 'Continuous Backup (PITR)', hash: 'arn:aws:dynamodb:ap-south-1:users' },
  { id: 'PITR-002', db: 'Partners (DynamoDB)', timestamp: new Date().toISOString(), size: 'Auto-Scaling', encrypted: true, reason: 'Continuous Backup (PITR)', hash: 'arn:aws:dynamodb:ap-south-1:partners' },
  { id: 'PITR-003', db: 'Bookings (DynamoDB)', timestamp: new Date().toISOString(), size: 'Auto-Scaling', encrypted: true, reason: 'Continuous Backup (PITR)', hash: 'arn:aws:dynamodb:ap-south-1:bookings' }
];

const DisasterRecovery = () => {
  const [snapshots, setSnapshots] = useState(initialSnapshots);
  const [reason, setReason] = useState('');
  const [targetDb, setTargetDb] = useState('Users (DynamoDB)');
  const [isTriggering, setIsTriggering] = useState(false);
  const [progress, setProgress] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  // AWS Snapshot Monitor Grid Mock Data State
  const monitorGrid = [
    { name: 'Users Table', lastSync: 'Continuous', size: 'Auto', status: 'PITR Active', encrypted: 'AES-256 (KMS)' },
    { name: 'Partners Table', lastSync: 'Continuous', size: 'Auto', status: 'PITR Active', encrypted: 'AES-256 (KMS)' },
    { name: 'Bookings Table', lastSync: 'Continuous', size: 'Auto', status: 'PITR Active', encrypted: 'AES-256 (KMS)' }
  ];

  // Triggers AWS on-demand backup simulation
  const handleTriggerSnapshot = (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      triggerGlobalNotification('Please specify an administrative reason for the on-demand backup.', 'warning');
      return;
    }

    setIsTriggering(true);
    setProgress(0);

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          
          // Add new backup record
          const newSnapshot = {
            id: `BACKUP-${100 + snapshots.length + 1}`,
            db: targetDb,
            timestamp: new Date().toISOString(),
            size: 'Auto',
            encrypted: true,
            reason: reason.trim(),
            hash: `arn:aws:dynamodb:backup-manual-${Date.now()}`
          };

          setSnapshots((prevSnaps) => [newSnapshot, ...prevSnaps]);
          setIsTriggering(false);
          setReason('');
          triggerGlobalNotification(`Manual backup triggered successfully for ${targetDb}.`, 'success');
          return 0;
        }
        return prev + 25; // 25% increments
      });
    }, 500);
  };

  const filteredSnapshots = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return snapshots;
    return snapshots.filter(snap => 
      snap.id.toLowerCase().includes(query) || 
      snap.db.toLowerCase().includes(query) || 
      snap.reason.toLowerCase().includes(query) ||
      snap.hash.toLowerCase().includes(query)
    );
  }, [searchQuery, snapshots]);

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Disaster Recovery & Backups</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Manage DynamoDB Point-in-Time Recovery (PITR) and on-demand database backups.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Active Monitoring Grid */}
          <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden flex flex-col">
            <div className="border-b border-slate-100 dark:border-slate-800 p-5 bg-slate-50/50 dark:bg-slate-950/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Database className="h-5 w-5 text-slate-500" />
                <h3 className="font-bold text-slate-900 dark:text-white">Active DynamoDB Status</h3>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/30 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/40">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                Continuous Sync
              </span>
            </div>
            
            <div className="overflow-x-auto p-2">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="font-bold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                    <th className="px-4 py-3">Table Engine</th>
                    <th className="px-4 py-3">Last Sync</th>
                    <th className="px-4 py-3">Size Metric</th>
                    <th className="px-4 py-3">Encryption</th>
                    <th className="px-4 py-3">Cluster Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50 text-sm">
                  {monitorGrid.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                      <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">{row.name}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400 font-mono text-xs">{row.lastSync}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400 font-mono text-xs">{row.size}</td>
                      <td className="px-4 py-3"><span className="text-xs font-mono font-semibold text-slate-500">{row.encrypted}</span></td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 px-2 py-0.5 text-[10px] font-bold border border-emerald-100 dark:border-emerald-900/40">
                          <CheckCircle className="h-3 w-3" /> {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Backup Archives */}
          <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden flex flex-col">
            <div className="border-b border-slate-100 dark:border-slate-800 p-5 bg-slate-50/50 dark:bg-slate-950/50 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="font-bold text-slate-900 dark:text-white">Backup Restoration Archives</h3>
              <div className="relative">
                <Search className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search archives..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full sm:w-64 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 py-2 pl-9 pr-3 text-xs text-slate-700 dark:text-slate-300 placeholder-slate-400 outline-none focus:border-violet-500 transition-all"
                />
              </div>
            </div>

            <div className="overflow-x-auto p-2">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="font-bold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                    <th className="px-4 py-3">Snapshot ID</th>
                    <th className="px-4 py-3">Target Table</th>
                    <th className="px-4 py-3">Reason / Type</th>
                    <th className="px-4 py-3">Timestamp (UTC)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50 text-sm">
                  {filteredSnapshots.length > 0 ? filteredSnapshots.map((snap) => (
                    <tr key={snap.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <span className="font-bold text-slate-800 dark:text-slate-200">{snap.id}</span>
                          <span className="text-[10px] font-mono text-slate-400" title={snap.hash}>{snap.hash.substring(0,25)}...</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">{snap.db}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-slate-600 dark:text-slate-400">{snap.reason}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs font-mono">{new Date(snap.timestamp).toLocaleString()}</td>
                    </tr>
                  )) : (
                    <tr><td colSpan="4" className="px-4 py-8 text-center text-xs text-slate-400">No backup archives match your search query.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Trigger Manual Snapshot Panel */}
        <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm flex flex-col h-max">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="h-5 w-5 text-violet-500" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Trigger Manual Backup</h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
            While Point-In-Time Recovery (PITR) continuously backs up your DynamoDB tables, you can force an explicit on-demand backup prior to destructive actions.
          </p>

          <form onSubmit={handleTriggerSnapshot} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Target Table</label>
              <select 
                value={targetDb}
                onChange={(e) => setTargetDb(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 px-3.5 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 outline-none focus:bg-white focus:border-violet-500 cursor-pointer"
              >
                <option value="Users (DynamoDB)">Users</option>
                <option value="Partners (DynamoDB)">Partners</option>
                <option value="Bookings (DynamoDB)">Bookings</option>
                <option value="AuditLogs (DynamoDB)">Audit Logs</option>
              </select>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Administrative Reason</label>
              <input 
                type="text" 
                placeholder="e.g. Pre-deployment backup v3.2..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 px-3.5 py-2.5 text-sm text-slate-700 dark:text-slate-300 placeholder-slate-400 outline-none focus:bg-white focus:border-violet-500 transition-all"
              />
            </div>

            {isTriggering && (
              <div className="pt-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  <span>Executing AWS Backup...</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-violet-600 h-2 rounded-full transition-all duration-300 ease-out" 
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
            )}

            <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="submit"
                disabled={isTriggering}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-900 px-4 py-2.5 text-sm font-bold shadow-md disabled:opacity-50 transition-all cursor-pointer"
              >
                {isTriggering ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                <span>{isTriggering ? 'Processing AWS API...' : 'Force Backup Target'}</span>
              </button>
            </div>
          </form>

          <div className="mt-6 rounded-xl bg-violet-50 dark:bg-violet-950/20 border border-violet-100 dark:border-violet-900/30 p-4 flex items-start gap-3">
            <ShieldCheck className="h-5 w-5 text-violet-600 dark:text-violet-400 shrink-0 mt-0.5" />
            <p className="text-xs font-medium text-violet-800 dark:text-violet-300 leading-relaxed">
              DynamoDB backups are encrypted at rest via AWS KMS. Snapshots are retained securely.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DisasterRecovery;
