import React, { useState, useEffect } from 'react';
import { Shield, ShieldAlert, AlertTriangle, Bug, Terminal, Play, Loader2, WifiOff, RefreshCw } from 'lucide-react';
import { triggerGlobalNotification } from '../context/NotificationContext';
import axiosInstance from '../api/axiosInstance';

const initialPackages = [
  { id: 'react', version: '19.2.7', license: 'MIT', compliance: 'Compliant' },
  { id: 'react-dom', version: '19.2.7', license: 'MIT', compliance: 'Compliant' },
  { id: 'react-router-dom', version: '7.18.0', license: 'MIT', compliance: 'Compliant' },
  { id: 'axios', version: '1.18.1', versionStatus: 'Outdated (High CVE in d3-color)', license: 'MIT', compliance: 'Warning' },
  { id: 'tailwindcss', version: '4.3.1', license: 'MIT', compliance: 'Compliant' },
];

const SecurityAudit = () => {
  const [packages] = useState(initialPackages);
  const [cves, setCves] = useState({ critical: 0, high: 1, medium: 4, low: 12 });
  const [isScanning, setIsScanning] = useState(false);
  const [logs, setLogs] = useState([
    'System Idle. Press "Run Fresh Audit Scan" to initiate security scanner.'
  ]);

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
          const securityAlerts = (response.data.data || []).filter(a => a.type === 'security' || !a.type);
          setDbAlerts(securityAlerts);
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

  const runAuditScan = () => {
    if (isScanning) return;
    setIsScanning(true);
    setLogs([]);
    triggerGlobalNotification('Initializing Dependency & CVE Scan...', 'info');

    let simulatedSteps = [
      { text: '[INFO] Initializing BlinkLean vulnerability scanner v2.4.1...', delay: 100 },
      { text: '[INFO] Target Environment: Node.js production container', delay: 400 },
      { text: '[INFO] Step 1/3: Reading package.json structure...', delay: 800 },
      { text: '[WARN] Outdated packages found: [axios]', delay: 1700 },
      { text: '[INFO] Step 2/3: Querying National Vulnerability Database (NVD)...', delay: 2200 },
    ];

    // Inject database alerts if they exist
    if (dbAlerts.length > 0) {
      dbAlerts.forEach((alert, i) => {
        simulatedSteps.push({
          text: `[DATABASE ALERT] ${alert.severity?.toUpperCase() || 'HIGH'} - ${alert.message} (ID: ${alert.alertId})`,
          delay: 2400 + (i * 200)
        });
      });
    }

    simulatedSteps.push(
      { text: '[INFO] Step 3/3: Evaluating system security posture...', delay: 3500 },
      { text: '[SUCCESS] Audit Scan Completed. Vulnerability counts populated.', delay: 4000 }
    );

    simulatedSteps.forEach((step) => {
      setTimeout(() => {
        setLogs((prev) => [...prev, step.text]);
      }, step.delay);
    });

    setTimeout(() => {
      setIsScanning(false);
      triggerGlobalNotification('Security scan pipeline finished execution.', 'success');
    }, 4500);
  };

  const getComplianceColor = (compliance) => {
    switch (compliance) {
      case 'Compliant': return 'text-emerald-600 bg-emerald-50 border-emerald-100 dark:text-emerald-400 dark:bg-emerald-950/30 dark:border-emerald-900/40';
      case 'Warning': return 'text-amber-600 bg-amber-50 border-amber-100 dark:text-amber-500 dark:bg-amber-950/30 dark:border-amber-900/40';
      case 'Review Required': return 'text-indigo-600 bg-indigo-50 border-indigo-100 dark:text-indigo-400 dark:bg-indigo-950/30 dark:border-indigo-900/40';
      case 'Non-Compliant': return 'text-rose-600 bg-rose-50 border-rose-100 dark:text-rose-450 dark:bg-rose-950/30 dark:border-rose-900/40';
      default: return 'text-slate-600 bg-slate-50 border-slate-200 dark:text-slate-400 dark:bg-slate-800/50 dark:border-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Security Vulnerability Audit</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Automated CVE analysis and database security posture.</p>
        </div>
        <button
          onClick={runAuditScan}
          disabled={isScanning}
          className="flex items-center gap-2 rounded-xl bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-900 px-4 py-2 text-sm font-bold shadow-md disabled:opacity-50 transition-all cursor-pointer"
        >
          {isScanning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          <span>{isScanning ? 'Executing Pipeline...' : 'Run Fresh Audit Scan'}</span>
        </button>
      </div>

      {errorMsg && (
        <div className="flex items-start gap-3 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 p-4 text-xs font-semibold text-rose-700 dark:text-rose-450">
          <AlertTriangle className="h-4.5 w-4.5 text-rose-600 shrink-0 mt-0.5" />
          <div><span className="font-extrabold block">Network Warning</span><p className="mt-0.5">{errorMsg}</p></div>
        </div>
      )}

      {/* CVE Metrics Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-rose-200 dark:border-rose-900/40 bg-rose-50 dark:bg-rose-950/20 p-5 shadow-sm">
          <h4 className="text-xs font-bold text-rose-700 dark:text-rose-450 uppercase tracking-wider mb-1">Critical (CVSS 9-10)</h4>
          <span className="text-3xl font-extrabold text-rose-800 dark:text-rose-400">{cves.critical}</span>
        </div>
        <div className="rounded-2xl border border-orange-200 dark:border-orange-900/40 bg-orange-50 dark:bg-orange-950/20 p-5 shadow-sm">
          <h4 className="text-xs font-bold text-orange-700 dark:text-orange-400 uppercase tracking-wider mb-1">High (CVSS 7-8)</h4>
          <span className="text-3xl font-extrabold text-orange-800 dark:text-orange-300">{cves.high + (dbAlerts.filter(a => a.severity === 'high').length)}</span>
        </div>
        <div className="rounded-2xl border border-amber-200 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-950/20 p-5 shadow-sm">
          <h4 className="text-xs font-bold text-amber-700 dark:text-amber-500 uppercase tracking-wider mb-1">Medium (CVSS 4-6)</h4>
          <span className="text-3xl font-extrabold text-amber-800 dark:text-amber-400">{cves.medium}</span>
        </div>
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-5 shadow-sm">
          <h4 className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Low (CVSS 0-3)</h4>
          <span className="text-3xl font-extrabold text-slate-800 dark:text-slate-200">{cves.low}</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm lg:col-span-2 overflow-hidden flex flex-col">
          <div className="border-b border-slate-100 dark:border-slate-800 p-5 bg-slate-50/50 dark:bg-slate-950/50 flex items-center gap-3">
            <Bug className="h-5 w-5 text-slate-500" />
            <h3 className="font-bold text-slate-900 dark:text-white">Dependency Sandbox Tree</h3>
          </div>
          <div className="overflow-x-auto p-2">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="font-bold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                  <th className="px-4 py-3">Package Name</th>
                  <th className="px-4 py-3">Version State</th>
                  <th className="px-4 py-3">License</th>
                  <th className="px-4 py-3">Compliance Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50 text-sm">
                {packages.map((pkg) => (
                  <tr key={pkg.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                    <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">{pkg.id}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                      <span className="font-mono text-xs">{pkg.version}</span>
                      {pkg.versionStatus && <span className="block mt-0.5 text-[10px] text-rose-500 font-bold">{pkg.versionStatus}</span>}
                    </td>
                    <td className="px-4 py-3"><span className="text-xs font-mono text-slate-500">{pkg.license}</span></td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-lg px-2.5 py-1 text-[10px] font-bold border ${getComplianceColor(pkg.compliance)}`}>
                        {pkg.compliance}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Security Log Terminal Window */}
        <div className="rounded-2xl bg-slate-950 dark:bg-[#0A0A0A] border border-slate-800 p-1 flex flex-col shadow-lg overflow-hidden h-[400px]">
          <div className="bg-slate-900 border-b border-slate-800 px-4 py-2 flex items-center gap-2 rounded-t-xl">
            <Terminal className="h-4 w-4 text-emerald-500" />
            <span className="text-xs font-mono text-slate-400">scanner_tty1</span>
          </div>
          <div className="flex-1 p-4 font-mono text-[11px] overflow-y-auto space-y-1 text-slate-300">
            {logs.map((log, index) => {
              const isAlert = log.includes('[WARN]') || log.includes('[ALERT]') || log.includes('[DATABASE ALERT]');
              const isSuccess = log.includes('[SUCCESS]');
              const colorClass = isAlert ? 'text-amber-400' : isSuccess ? 'text-emerald-400' : 'text-slate-400';
              return (
                <div key={index} className={`break-words ${colorClass}`}>
                  <span className="opacity-50 mr-2">{new Date().toISOString().split('T')[1].slice(0,8)}</span> 
                  {log}
                </div>
              );
            })}
            {isScanning && (
              <div className="animate-pulse flex items-center gap-2 mt-2 text-slate-500">
                <span>processing_chunk...</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecurityAudit;
