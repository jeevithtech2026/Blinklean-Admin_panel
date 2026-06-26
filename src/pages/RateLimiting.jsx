import React, { useState } from 'react';
import { CheckCircle, RefreshCw } from 'lucide-react';
import { triggerGlobalNotification } from '../context/NotificationContext';

const initialBlacklist = [
  { ip: '203.0.113.89', rule: 'Auth Brute-Force Rate', volume: '12 attempts/sec', timeRemaining: '14 mins', status: 'Blocked' },
  { ip: '198.51.100.12', rule: 'Scraping Spike Threshold', volume: '84 requests/min', timeRemaining: '8 mins', status: 'Throttled' },
  { ip: '45.22.89.141', rule: 'Admin Port Scanner', volume: '120 requests/min', timeRemaining: '42 mins', status: 'Blocked' },
  { ip: '109.112.5.8', rule: 'API Abuse Rule Block', volume: '210 requests/min', timeRemaining: '11 mins', status: 'Blocked' }
];

const mockHourlyViolations = [
  { hour: '00:00 - 04:00', count: 42 },
  { hour: '04:00 - 08:00', count: 18 },
  { hour: '08:00 - 12:00', count: 124 },
  { hour: '12:00 - 16:00', count: 89 },
  { hour: '16:00 - 20:00', count: 210 },
  { hour: '20:00 - 24:00', count: 34 },
];

const RateLimiting = () => {
  const [blacklist, setBlacklist] = useState(initialBlacklist);
  const [publicLimit, setPublicLimit] = useState(100);
  const [adminLimit, setAdminLimit] = useState(500);
  const [authLimit, setAuthLimit] = useState(5);

  const [violations, setViolations] = useState(mockHourlyViolations);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Unblock / Whitelist IP handler
  const handleWhitelistIp = (ipAddress) => {
    setBlacklist((prev) => prev.filter((item) => item.ip !== ipAddress));
    triggerGlobalNotification(`IP ${ipAddress} successfully whitelisted and unblocked.`, 'success');
  };

  // Refreshes real-time security statistics
  const handleRefreshStats = () => {
    setIsRefreshing(true);
    triggerGlobalNotification('Refreshing API gateway traffic metrics...', 'info');

    setTimeout(() => {
      // Slightly alter violation metrics on recalculation
      const updated = violations.map((v) => {
        const delta = Math.floor((Math.random() - 0.5) * 15);
        return { ...v, count: Math.max(5, v.count + delta) };
      });
      setViolations(updated);
      setIsRefreshing(false);
      triggerGlobalNotification('Security charts updated.', 'success');
    }, 800);
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">API Rate Limiting & Security Throttling</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Configure firewall request thresholds, monitor IP blocks, and audit brute-force warning flags.</p>
        </div>
        <button
          onClick={handleRefreshStats}
          disabled={isRefreshing}
          className="flex items-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-900 text-white px-4 py-2.5 text-xs font-semibold shadow-md transition-all cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>{isRefreshing ? 'Refreshing...' : 'Refresh Firewall logs'}</span>
        </button>
      </div>

      {/* Dynamic Rate Limiting Control Sliders */}
      <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
        <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4">Request Rate Threshold Controllers</h2>
        
        <div className="grid gap-6 md:grid-cols-3">
          {/* Slider 1: Public API Limit */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <label htmlFor="publicLimit" className="font-bold text-slate-500 dark:text-slate-400">Public API Limit</label>
              <span className="font-mono font-extrabold text-violet-600 dark:text-violet-400">{publicLimit} req/min</span>
            </div>
            <input
              id="publicLimit"
              type="range"
              min="10"
              max="500"
              step="10"
              value={publicLimit}
              onChange={(e) => {
                setPublicLimit(Number(e.target.value));
                triggerGlobalNotification(`Public API limit set to ${e.target.value} req/min.`, 'success');
              }}
              className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-violet-600"
            />
          </div>

          {/* Slider 2: Admin Gateway Limit */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <label htmlFor="adminLimit" className="font-bold text-slate-500 dark:text-slate-400">Admin Gateway Limit</label>
              <span className="font-mono font-extrabold text-violet-600 dark:text-violet-400">{adminLimit} req/min</span>
            </div>
            <input
              id="adminLimit"
              type="range"
              min="100"
              max="2000"
              step="50"
              value={adminLimit}
              onChange={(e) => {
                setAdminLimit(Number(e.target.value));
                triggerGlobalNotification(`Admin Gateway threshold set to ${e.target.value} req/min.`, 'success');
              }}
              className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-violet-600"
            />
          </div>

          {/* Slider 3: Auth Lockout Limit */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <label htmlFor="authLimit" className="font-bold text-slate-500 dark:text-slate-400">Auth Endpoint Lockout</label>
              <span className="font-mono font-extrabold text-violet-600 dark:text-violet-400">{authLimit} failures/5m</span>
            </div>
            <input
              id="authLimit"
              type="range"
              min="3"
              max="20"
              step="1"
              value={authLimit}
              onChange={(e) => {
                setAuthLimit(Number(e.target.value));
                triggerGlobalNotification(`Auth lockout threshold set to ${e.target.value} failed attempts/5m.`, 'success');
              }}
              className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-violet-600"
            />
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Real-time IP Blacklist Matrix Table */}
        <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm lg:col-span-2 space-y-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Active Firewall IP Restrictions</h2>
            <p className="text-xs text-slate-400 dark:text-slate-550">Currently throttled or blocked IP addresses violating security thresholds.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/75 dark:bg-slate-850/50 border-b border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="px-6 py-3">IP Address</th>
                  <th className="px-6 py-3">Violated Rule</th>
                  <th className="px-6 py-3 text-center">Spike Volume</th>
                  <th className="px-6 py-3 text-center">TTL</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-855 text-xs">
                {blacklist.length > 0 ? (
                  blacklist.map((item) => (
                    <tr key={item.ip} className="hover:bg-slate-50/50 dark:hover:bg-slate-855/30 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-slate-850 dark:text-slate-200">{item.ip}</td>
                      <td className="px-6 py-4 font-semibold text-slate-550 dark:text-slate-450">{item.rule}</td>
                      <td className="px-6 py-4 text-center font-extrabold text-slate-800 dark:text-slate-350">{item.volume}</td>
                      <td className="px-6 py-4 text-center font-bold text-violet-600 dark:text-violet-400">{item.timeRemaining}</td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleWhitelistIp(item.ip)}
                          className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-450 px-2.5 py-1 font-extrabold border border-emerald-100/50 dark:border-emerald-900/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors cursor-pointer"
                          title="Whitelist IP"
                        >
                          <CheckCircle className="h-3.5 w-3.5" />
                          <span>Unblock</span>
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-slate-400 dark:text-slate-500">
                      <div className="flex flex-col items-center gap-2">
                        <CheckCircle className="h-8 w-8 text-slate-300 dark:text-slate-700" />
                        <span>No IP addresses currently restricted.</span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Throttling Violations Analytics Chart */}
        <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Security Block Events</h2>
            <p className="text-xs text-slate-400 dark:text-slate-500">Number of blocked request attempts (Last 24 Hours).</p>

            {/* Custom Bar Chart using Tailwind HTML elements */}
            <div className="flex items-end justify-between h-44 pt-6 gap-2">
              {violations.map((v) => {
                // Calculate percentage height based on maximum of 250 blocks scale limits
                const barHeight = Math.min(100, (v.count / 250) * 100);
                return (
                  <div key={v.hour} className="flex-1 flex flex-col items-center gap-2 group relative">
                    <div 
                      className="w-full bg-violet-600 hover:bg-violet-500 rounded-t-md transition-all duration-500 ease-out" 
                      style={{ height: `${barHeight}%` }}
                    >
                      {/* Tooltip */}
                      <span className="opacity-0 group-hover:opacity-100 absolute -top-8 bg-slate-950 text-white text-[9px] px-1.5 py-0.5 rounded shadow-md whitespace-nowrap transition-opacity pointer-events-none z-10">
                        {v.count} blocks
                      </span>
                    </div>
                    <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 transform rotate-12 text-center shrink-0">
                      {v.hour.split(' ')[0]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800 pt-4 mt-6">
            <div className="rounded-xl bg-violet-50 dark:bg-violet-950/20 border border-violet-100/50 dark:border-violet-900/30 p-3.5 text-xs text-violet-800 dark:text-violet-400 leading-normal font-medium">
              API Gateways automatically log traffic spikes. Blocks are systematically lifted when the IP's TTL reaches 0.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RateLimiting;
