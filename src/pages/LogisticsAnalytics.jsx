import React, { useState, useEffect, useRef } from 'react';
import { Truck, MapPin, Navigation, Compass, AlertCircle, CheckCircle2, RefreshCw, Radio, Bell, Wrench, CircleDot, WifiOff } from 'lucide-react';
import axiosInstance from '../api/axiosInstance';

// ── Service Zones Configuration ───────────────────────────────────────────────
const SERVICE_ZONES = [
  { id: 'z01', name: 'Vijayanagar',           pin: '560040', city: 'Bengaluru' },
  { id: 'z02', name: 'Chandra Layout',         pin: '560040', city: 'Bengaluru' },
  { id: 'z03', name: 'Attiguppe',              pin: '560040', city: 'Bengaluru' },
  { id: 'z04', name: 'Hampinagar',             pin: '560104', city: 'Bengaluru' },
  { id: 'z05', name: 'Govindarajanagar',       pin: '560040', city: 'Bengaluru' },
  { id: 'z06', name: 'Bapujinagar',            pin: '560026', city: 'Bengaluru' },
  { id: 'z07', name: 'Basaveshwaranagar',      pin: '560079', city: 'Bengaluru' },
  { id: 'z08', name: 'Rajajinagar',            pin: '560010', city: 'Bengaluru' },
  { id: 'z09', name: 'Magadi Road',            pin: '560023', city: 'Bengaluru' },
  { id: 'z10', name: 'Kamakshipalya',          pin: '560079', city: 'Bengaluru' },
  { id: 'z11', name: 'Nagarabhavi',            pin: '560072', city: 'Bengaluru' },
  { id: 'z12', name: 'RPC Layout',             pin: '560040', city: 'Bengaluru' },
  { id: 'z13', name: 'Saraswathipuram',        pin: '560040', city: 'Bengaluru' },
  { id: 'z14', name: 'Mahalakshmi Layout',     pin: '560086', city: 'Bengaluru' },
  { id: 'z15', name: 'RR Nagar',               pin: '560098', city: 'Bengaluru' },
  { id: 'z16', name: 'Giri Nagar',             pin: '560085', city: 'Bengaluru' },
  { id: 'z17', name: 'Banashankari 2nd Stage', pin: '560070', city: 'Bengaluru' },
];

// Helper to match a booking address to a known zone
const detectZone = (address = '') => {
  const lower = address.toLowerCase();
  return SERVICE_ZONES.find(z => lower.includes(z.name.toLowerCase())) || null;
};

const LogisticsAnalytics = () => {
  const [activeRoutes, setActiveRoutes]   = useState([]);
  const [onlinePartners, setOnlinePartners] = useState([]);
  const [zoneStats, setZoneStats]         = useState({});
  const [loading, setLoading]             = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState(null);
  const [errorMsg, setErrorMsg]           = useState('');
  const timerRef = useRef(null);

  const fetchLogistics = async () => {
    try {
      setLoading(true);

      // Fetch both bookings and partners in parallel
      const [bookingsRes, partnersRes] = await Promise.all([
        axiosInstance.get('/api/v1/data/bookings'),
        axiosInstance.get('/api/v1/data/partners'),
      ]);

      // ── Bookings: active routes + zone stats ──────────────────────────────
      if (bookingsRes.data?.data) {
        const valid = bookingsRes.data.data.filter(
          b => b.status && !['cancelled', 'failed'].includes(b.status.toLowerCase())
        );

        const mappedRoutes = valid.map(b => {
          const s = b.status.toLowerCase();
          let progress = 10, status = 'Departing', time = 'Scheduling...';
          if (s === 'completed') { progress = 100; status = 'Delivered'; time = 'Fulfilled'; }
          else if (s === 'confirmed') { progress = 35; status = 'On Route'; time = b.time || 'Next slot'; }
          return {
            id: b.bookingId,
            driver: b.serviceName || 'Unknown Team',
            destination: (b.address || 'Location Unknown').substring(0, 30) + '...',
            progress, status, time,
          };
        });
        setActiveRoutes(mappedRoutes);

        const stats = {};
        valid.forEach(b => {
          const zone = detectZone(b.address || '');
          if (zone) {
            if (!stats[zone.id]) stats[zone.id] = 0;
            stats[zone.id]++;
          }
        });
        setZoneStats(stats);
      }

      // ── Partners: online/offline feed ─────────────────────────────────────
      if (partnersRes.data?.data) {
        const allPartners = partnersRes.data.data;
        const mapped = allPartners.map(p => ({
          id: p.id || p.partnerId,
          name: p.name || p.partnerName || 'Unknown Partner',
          service: p.serviceType || p.service || p.category || 'Cleaning Service',
          zone: detectZone(p.address || p.area || p.location || ''),
          area: p.address || p.area || p.location || 'Unknown Area',
          isOnline: (p.status || '').toLowerCase() === 'active' ||
                    (p.isOnline === true) ||
                    (p.availability || '').toLowerCase() === 'available',
          lastSeen: p.updatedAt || p.lastActive || p.createdAt || null,
        }));
        // Sort: online partners first, then by name
        mapped.sort((a, b) => (b.isOnline ? 1 : 0) - (a.isOnline ? 1 : 0));
        setOnlinePartners(mapped.slice(0, 8));
      }

      setLastRefreshed(new Date());
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogistics();
    // Auto-refresh every 60 seconds
    timerRef.current = setInterval(fetchLogistics, 60_000);
    return () => clearInterval(timerRef.current);
  }, []);

  const totalActive = activeRoutes.filter(r => r.status !== 'Delivered').length;

  const zoneStatusColor = (zoneId) => {
    const count = zoneStats[zoneId] || 0;
    if (count > 3) return { dot: 'bg-emerald-500', badge: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/40', label: 'Active' };
    if (count > 0) return { dot: 'bg-amber-500',   badge: 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-500 border-amber-100 dark:border-amber-900/40',     label: 'Low Activity' };
    return             { dot: 'bg-slate-300 dark:bg-slate-600', badge: 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-100 dark:border-slate-700', label: 'Standby' };
  };

  const activityStatusColor = (status = '') => {
    const s = status.toLowerCase();
    if (s === 'confirmed') return 'text-indigo-600 dark:text-indigo-400';
    if (s === 'completed') return 'text-emerald-600 dark:text-emerald-400';
    return 'text-amber-600 dark:text-amber-400';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Logistics Operations</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Track active dispatch lines, driver capacity, and fulfillment efficiency.</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          {lastRefreshed && (
            <span>Last updated: {lastRefreshed.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
          )}
          <button
            onClick={fetchLogistics}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm flex items-center gap-5">
          <span className="rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 p-4 text-indigo-600 dark:text-indigo-400">
            <Truck className="h-6 w-6" />
          </span>
          <div>
            <span className="text-xs text-slate-400 font-semibold block uppercase">Total Dispatched</span>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">{totalActive} Active</h3>
            <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5 mt-1">
              <CheckCircle2 className="h-3 w-3 inline" /> Real-time Tracking
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm flex items-center gap-5">
          <span className="rounded-2xl bg-sky-50 dark:bg-sky-950/30 border border-sky-100 dark:border-sky-900/40 p-4 text-sky-600 dark:text-sky-400">
            <Compass className="h-6 w-6" />
          </span>
          <div>
            <span className="text-xs text-slate-400 font-semibold block uppercase">Avg Completion</span>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">42.4 Min</h3>
            <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold flex items-center gap-0.5 mt-1">
              Based on service metrics
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm flex items-center gap-5">
          <span className="rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/40 p-4 text-amber-600 dark:text-amber-500">
            <Navigation className="h-6 w-6" />
          </span>
          <div>
            <span className="text-xs text-slate-400 font-semibold block uppercase">Network Load</span>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">{totalActive > 10 ? 'High Capacity' : 'Normal Load'}</h3>
            <span className="text-[10px] text-amber-600 dark:text-amber-500 font-semibold flex items-center gap-0.5 mt-1">
              <AlertCircle className="h-3 w-3 inline" /> Monitoring fleet
            </span>
          </div>
        </div>
      </div>

      {/* ── Service Zone Coverage ──────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <MapPin className="h-5 w-5 text-violet-500" />
              Service Zone Coverage
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Live status of areas where BlinkLean is currently operating</p>
          </div>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{SERVICE_ZONES.length} Zones</span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {SERVICE_ZONES.map(zone => {
            const { dot, badge, label } = zoneStatusColor(zone.id);
            const count = zoneStats[zone.id] || 0;
            return (
              <div key={zone.id} className="flex items-center justify-between rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30 px-4 py-3 gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="relative flex h-2.5 w-2.5 shrink-0">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-60 ${dot}`}></span>
                    <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${dot}`}></span>
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{zone.name}</p>
                    <p className="text-[10px] text-slate-400 font-mono">PIN: {zone.pin} · {zone.city}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold border ${badge}`}>
                    {label}
                  </span>
                  {count > 0 && (
                    <span className="text-[10px] font-semibold text-slate-400">{count} booking{count > 1 ? 's' : ''}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Route Map & Active Dispatches ─────────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Map visualization */}
        <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Fulfillment Route Grid</h2>
              <p className="text-xs text-slate-400">Real-time mock GPS tracking visualization</p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/30 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/40">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping"></span>
              Live Dispatch Feed
            </span>
          </div>

          <div className="relative h-72 w-full rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 overflow-hidden flex items-center justify-center">
            <div className="absolute inset-0 grid grid-cols-12 grid-rows-6 gap-2 p-4 opacity-[0.06] dark:opacity-20">
              {Array.from({ length: 72 }).map((_, i) => (
                <div key={i} className="bg-slate-950 dark:bg-slate-500 rounded-sm"></div>
              ))}
            </div>
            <svg className="absolute inset-0 h-full w-full pointer-events-none" viewBox="0 0 500 250">
              <path d="M 50,50 L 150,50 L 150,150 L 300,150 L 300,80 L 450,80" fill="none" stroke="#cbd5e1" strokeWidth="3" strokeLinecap="round" className="dark:stroke-slate-700" />
              <path d="M 100,200 L 250,200 L 250,100 L 400,100" fill="none" stroke="#cbd5e1" strokeWidth="3" strokeLinecap="round" className="dark:stroke-slate-700" />
              <circle cx="50" cy="50" r="5" fill="#8b5cf6" />
              <circle cx="450" cy="80" r="5" fill="#f43f5e" />
              <circle cx="100" cy="200" r="5" fill="#0ea5e9" />
              <circle cx="400" cy="100" r="5" fill="#f43f5e" />
            </svg>
            {activeRoutes.slice(0, 2).map((r, i) => (
              <div key={r.id} className={`absolute ${i === 0 ? 'top-[35px] left-[130px]' : 'bottom-[40px] right-[120px]'} flex items-center gap-1.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs shadow-sm border border-slate-100 dark:border-slate-800 rounded-lg px-2 py-1 text-[10px] font-bold text-slate-700 dark:text-slate-300 ${i === 0 ? 'animate-bounce' : ''}`}>
                <MapPin className={`h-3 w-3 ${i === 0 ? 'text-violet-600' : 'text-sky-500'}`} />
                {r.id.slice(-5)} ({r.progress}%)
              </div>
            ))}
          </div>
        </div>

        {/* Active Dispatches panel */}
        <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm flex flex-col max-h-[400px] overflow-y-auto">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Active Dispatches</h2>
          {loading ? (
            <div className="flex justify-center items-center h-32 text-slate-400">
              <RefreshCw className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <div className="space-y-4">
              {activeRoutes.length > 0 ? activeRoutes.slice(0, 8).map((route) => (
                <div key={route.id} className="flex flex-col gap-2 rounded-xl bg-slate-50/70 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800 p-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-bold text-slate-950 dark:text-slate-200">{route.id}</span>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      route.status === 'Delivered' ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/40' :
                      route.status === 'On Route'  ? 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40' :
                                                     'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-500 border border-amber-100 dark:border-amber-900/40'
                    }`}>{route.status}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[120px]">{route.driver}</span>
                    <span className="text-slate-400 font-medium whitespace-nowrap">{route.time}</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 mt-1 overflow-hidden">
                    <div className={`h-1.5 rounded-full ${
                      route.status === 'Delivered' ? 'bg-emerald-500' :
                      route.status === 'On Route'  ? 'bg-indigo-600' : 'bg-amber-500'
                    }`} style={{ width: `${route.progress}%` }}></div>
                  </div>
                </div>
              )) : (
                <p className="text-xs text-slate-500 text-center">No active bookings found.</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Partner Online Status Feed ─────────────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Radio className="h-5 w-5 text-emerald-500" />
              Partner Online Status
              <span className="relative flex h-2 w-2 ml-1">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Partners currently available in your service zones — auto-refreshes every 60 seconds</p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
              {onlinePartners.filter(p => p.isOnline).length} Online
            </span>
            <span className="flex items-center gap-1.5 font-semibold text-slate-400">
              <span className="h-2 w-2 rounded-full bg-slate-300 dark:bg-slate-600"></span>
              {onlinePartners.filter(p => !p.isOnline).length} Offline
            </span>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-20 text-slate-400">
            <RefreshCw className="h-5 w-5 animate-spin" />
          </div>
        ) : onlinePartners.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {onlinePartners.map((partner) => (
              <div key={partner.id} className={`flex items-center gap-3 rounded-xl border px-4 py-3.5 transition-all ${
                partner.isOnline
                  ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/40'
                  : 'bg-slate-50/50 dark:bg-slate-800/20 border-slate-100 dark:border-slate-800'
              }`}>
                {/* Avatar */}
                <div className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold text-sm ${
                  partner.isOnline
                    ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                }`}>
                  {(partner.name || '?').substring(0, 2).toUpperCase()}
                  {/* Online dot */}
                  <span className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white dark:border-slate-900 ${
                    partner.isOnline ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'
                  }`}></span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{partner.name}</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1 truncate">
                    <Wrench className="h-2.5 w-2.5 shrink-0" />
                    {partner.service}
                  </p>
                  <p className="text-[10px] text-slate-400 flex items-center gap-1 truncate mt-0.5">
                    <MapPin className="h-2.5 w-2.5 shrink-0" />
                    {partner.zone ? partner.zone.name : partner.area}
                  </p>
                </div>

                {/* Status badge */}
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold border shrink-0 ${
                  partner.isOnline
                    ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'
                }`}>
                  {partner.isOnline ? <CircleDot className="h-2.5 w-2.5" /> : <WifiOff className="h-2.5 w-2.5" />}
                  {partner.isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-slate-400 gap-3">
            <Bell className="h-8 w-8 text-slate-300 dark:text-slate-700" />
            <p className="text-sm font-semibold text-slate-500">No partner data found</p>
            <p className="text-xs text-center">Partner availability will appear here once partners are registered in the system.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LogisticsAnalytics;
