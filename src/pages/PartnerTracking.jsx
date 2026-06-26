import React, { useState, useEffect, useMemo } from 'react';
import { MapPin, CalendarClock, RefreshCw, AlertTriangle, WifiOff, Clock } from 'lucide-react';
import axiosInstance from '../api/axiosInstance';
import { useTheme } from '../context/ThemeContext';

const PartnerTracking = () => {
  const { density } = useTheme();
  const [locations, setLocations] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [activeTab, setActiveTab] = useState('locations'); // 'locations' | 'schedules'

  useEffect(() => {
    let isMounted = true;
    const fetchTrackingData = async () => {
      try {
        setLoading(true);
        setErrorMsg('');
        setIsOffline(false);

        const [locRes, schedRes] = await Promise.all([
          axiosInstance.get('/api/v1/data/partner-locations'),
          axiosInstance.get('/api/v1/data/partner-schedules')
        ]);

        if (isMounted) {
          setLocations(locRes.data?.data || []);
          setSchedules(schedRes.data?.data || []);
        }
      } catch (error) {
        console.warn(`[Tracking API Error] failed.`, error.message);
        if (isMounted) {
          setIsOffline(true);
          setErrorMsg(`Failed to connect to backend: ${error.message}`);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchTrackingData();

    return () => { isMounted = false; };
  }, []);

  const isCompact = density === 'compact';
  const thPadding = isCompact ? 'px-4 py-2.5 text-[10px]' : 'px-6 py-4 text-xs';
  const tdPadding = isCompact ? 'px-4 py-2' : 'px-6 py-4';
  const bodyTextSize = isCompact ? 'text-xs' : 'text-sm';

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Partner Locations & Schedules</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Track partner availability, routing, and location coordinates.</p>
        </div>

        <div className="flex items-center gap-3">
          {isOffline && (
            <div className="flex items-center gap-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 px-3.5 py-2 text-xs font-bold text-amber-700 dark:text-amber-500 border border-amber-100/50 dark:border-amber-900/40 shadow-xs">
              <WifiOff className="h-4 w-4 shrink-0" />
              <span>Offline</span>
            </div>
          )}
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

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800/50 rounded-xl w-max border border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('locations')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'locations' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs border border-slate-200 dark:border-slate-700' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'}`}
        >
          <MapPin className="h-4 w-4" /> Locations ({locations.length})
        </button>
        <button
          onClick={() => setActiveTab('schedules')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'schedules' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs border border-slate-200 dark:border-slate-700' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'}`}
        >
          <CalendarClock className="h-4 w-4" /> Schedules ({schedules.length})
        </button>
      </div>

      {/* Table Content */}
      {loading ? (
        <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-6 text-center text-slate-500">
          <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-indigo-500" />
          <p className="text-sm font-semibold">Loading data from AWS DynamoDB...</p>
        </div>
      ) : activeTab === 'locations' ? (
        <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/75 dark:bg-slate-850/50 border-b border-slate-100 dark:border-slate-800 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className={thPadding}>Partner ID</th>
                <th className={thPadding}>Coordinates (Lat, Lng)</th>
                <th className={thPadding}>Last Updated</th>
              </tr>
            </thead>
            <tbody className={`divide-y divide-slate-100 dark:divide-slate-800 ${bodyTextSize}`}>
              {locations.length > 0 ? (
                locations.map((loc, i) => (
                  <tr key={loc.partnerId || i} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/30">
                    <td className={tdPadding}><span className="font-mono font-bold text-slate-700 dark:text-slate-300">{loc.partnerId || 'N/A'}</span></td>
                    <td className={tdPadding}>
                      <div className="flex items-center gap-1.5 font-medium text-slate-600 dark:text-slate-400">
                        <MapPin className="h-3.5 w-3.5 text-indigo-500" />
                        {loc.latitude}, {loc.longitude}
                      </div>
                    </td>
                    <td className={tdPadding}>{loc.updatedAt ? new Date(loc.updatedAt).toLocaleString() : '—'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" className="px-6 py-12 text-center text-slate-400">No partner locations found in DynamoDB.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/75 dark:bg-slate-850/50 border-b border-slate-100 dark:border-slate-800 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className={thPadding}>Partner ID</th>
                <th className={thPadding}>Availability Window</th>
                <th className={thPadding}>Status</th>
              </tr>
            </thead>
            <tbody className={`divide-y divide-slate-100 dark:divide-slate-800 ${bodyTextSize}`}>
              {schedules.length > 0 ? (
                schedules.map((sched, i) => (
                  <tr key={sched.scheduleId || i} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/30">
                    <td className={tdPadding}><span className="font-mono font-bold text-slate-700 dark:text-slate-300">{sched.partnerId || 'N/A'}</span></td>
                    <td className={tdPadding}>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 font-medium text-slate-600 dark:text-slate-400">
                          <Clock className="h-3.5 w-3.5" />
                          {sched.startTime || '??'} - {sched.endTime || '??'}
                        </div>
                        {sched.date && <div className="text-[10px] text-slate-500">Date: {sched.date}</div>}
                      </div>
                    </td>
                    <td className={tdPadding}>
                      <span className="inline-flex items-center rounded-lg px-2 py-0.5 text-[10px] font-bold border bg-blue-50 text-blue-700 border-blue-100">
                        {sched.status || 'Active'}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" className="px-6 py-12 text-center text-slate-400">No partner schedules found in DynamoDB.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default PartnerTracking;
