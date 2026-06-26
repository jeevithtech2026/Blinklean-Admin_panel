import React, { useState, useEffect, useCallback } from 'react';
import { Users, UserCheck, Calendar, CheckCircle2, BarChart3, WifiOff, AlertTriangle } from 'lucide-react';
import KpiCard from '../components/ui/KpiCard';
import HighestRatedServices from '../components/HighestRatedServices';
import RefreshController from '../components/ui/RefreshController';
import LiveActivityStream from '../components/ui/LiveActivityStream';
import axiosInstance from '../api/axiosInstance';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [frequency, setFrequency] = useState(0); // auto-refresh frequency in seconds, 0 = Off
  
  const [metrics, setMetrics] = useState({
    customers: { title: 'Total Registered Customers', value: '0', trend: '', isPositive: true, icon: Users },
    partners: { title: 'Total Registered Partners', value: '0', trend: '', isPositive: true, icon: UserCheck },
    bookings: { title: 'Active Bookings Today', value: '0', trend: '', isPositive: false, icon: Calendar },
    completions: { title: 'Completed Services Today', value: '0', trend: '', isPositive: true, icon: CheckCircle2 },
  });

  const fallbackMetrics = {
    customers: { title: 'Total Registered Customers', value: '12,480', trend: '+12.5%', isPositive: true, icon: Users },
    partners: { title: 'Total Registered Partners', value: '348', trend: '+4.2%', isPositive: true, icon: UserCheck },
    bookings: { title: 'Active Bookings Today', value: '95', trend: '-1.8%', isPositive: false, icon: Calendar },
    completions: { title: 'Completed Services Today', value: '1,248', trend: '+8.6%', isPositive: true, icon: CheckCircle2 },
  };

  const fetchDashboardSummary = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      setIsOffline(false);
      
      const response = await axiosInstance.get('/api/v1/admin/dashboard-summary');
      
      if (response.data) {
        const apiData = response.data;
        console.log('[Dashboard] Successfully retrieved dashboard summary:', apiData);
        setMetrics({
          customers: { title: 'Total Registered Customers', value: apiData.customers || '0', trend: apiData.customersTrend || '', isPositive: apiData.customersIsPositive !== false, icon: Users },
          partners: { title: 'Total Registered Partners', value: apiData.partners || '0', trend: apiData.partnersTrend || '', isPositive: apiData.partnersIsPositive !== false, icon: UserCheck },
          bookings: { title: 'Active Bookings Today', value: apiData.bookings || '0', trend: apiData.bookingsTrend || '', isPositive: apiData.bookingsIsPositive !== false, icon: Calendar },
          completions: { title: 'Completed Services Today', value: apiData.completions || '0', trend: apiData.completionsTrend || '', isPositive: apiData.completionsIsPositive !== false, icon: CheckCircle2 },
        });
      }
    } catch (error) {
      console.warn('[Dashboard API Error] /api/v1/admin/dashboard-summary request failed. Reverting to fallback metrics.', error.message);
      setIsOffline(true);
      setErrorMsg(`Failed to connect to gateway API: ${error.message || 'Connection refused'}. Running in offline fallback mode.`);
      setMetrics(fallbackMetrics);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch on mount
  useEffect(() => {
    console.log('[Dashboard] Mount data fetch initiating...');
    fetchDashboardSummary();
  }, [fetchDashboardSummary]);

  // Setup auto-refresh interval based on selected frequency
  useEffect(() => {
    if (frequency <= 0) return;

    console.log(`[Dashboard] Scheduling auto-refresh interval: every ${frequency} seconds.`);
    const intervalId = setInterval(() => {
      console.log('[Dashboard] Auto-refresh sync triggered.');
      fetchDashboardSummary();
    }, frequency * 1000);

    return () => {
      console.log('[Dashboard] Cleaning up auto-refresh interval.');
      clearInterval(intervalId);
    };
  }, [frequency, fetchDashboardSummary]);

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Overview Dashboard</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Coordinate and monitor system-wide operations stats and service trends.</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Offline Fallback Badge Indicator */}
          {isOffline && (
            <div className="flex items-center gap-1.5 rounded-xl bg-amber-50 px-3.5 py-2 text-xs font-bold text-amber-700 border border-amber-100/50 shadow-xs">
              <WifiOff className="h-4 w-4 shrink-0" />
              <span>Mock Database Offline Active</span>
            </div>
          )}
          <RefreshController 
            onRefresh={fetchDashboardSummary} 
            loading={loading}
            frequency={frequency}
            setFrequency={setFrequency}
          />
        </div>
      </div>

      {/* Network Alert Notification */}
      {errorMsg && (
        <div className="flex items-start gap-3 rounded-xl bg-rose-50 border border-rose-100 dark:border-rose-900/30 p-4 text-xs font-semibold text-rose-700 dark:text-rose-450">
          <AlertTriangle className="h-4.5 w-4.5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-extrabold block">Network Communication Warning</span>
            <p className="mt-0.5 text-rose-600 dark:text-rose-450 font-medium">{errorMsg}</p>
          </div>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title={metrics.customers.title}
          value={metrics.customers.value}
          trend={metrics.customers.trend}
          isPositive={metrics.customers.isPositive}
          icon={metrics.customers.icon}
          loading={loading}
        />
        <KpiCard
          title={metrics.partners.title}
          value={metrics.partners.value}
          trend={metrics.partners.trend}
          isPositive={metrics.partners.isPositive}
          icon={metrics.partners.icon}
          loading={loading}
        />
        <KpiCard
          title={metrics.bookings.title}
          value={metrics.bookings.value}
          trend={metrics.bookings.trend}
          isPositive={metrics.bookings.isPositive}
          icon={metrics.bookings.icon}
          loading={loading}
        />
        <KpiCard
          title={metrics.completions.title}
          value={metrics.completions.value}
          trend={metrics.completions.trend}
          isPositive={metrics.completions.isPositive}
          icon={metrics.completions.icon}
          loading={loading}
        />
      </div>

      {/* Bottom Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Column 1: Highest Rated Services */}
        <div className="lg:col-span-1">
          <HighestRatedServices loading={loading} />
        </div>

        {/* Column 2: Future Charts Placeholder */}
        <div className="lg:col-span-1 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm flex flex-col min-h-[350px] justify-between">
          <div className="border-b border-slate-50 dark:border-slate-850 pb-4 mb-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Analytics Trends</h2>
            <p className="text-xs text-slate-400 dark:text-slate-550">Reserved space for future visualization and interactive charts</p>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950/20 p-6 text-center">
            {loading ? (
              <div className="animate-pulse flex flex-col items-center space-y-3">
                <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-800"></div>
                <div className="h-4 w-32 rounded bg-slate-200 dark:bg-slate-800"></div>
                <div className="h-3 w-48 rounded bg-slate-100 dark:bg-slate-800"></div>
              </div>
            ) : (
              <>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/50 text-indigo-600 dark:text-indigo-400 mb-3 shadow-xs">
                  <BarChart3 className="h-6 w-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-350">Charts Visualization Area</h3>
                <p className="text-xs text-slate-500 dark:text-slate-450 mt-1 max-w-xs leading-normal">
                  Detailed analytics regarding order surges, customer acquisition, and partner ratings will be rendered here.
                </p>
              </>
            )}
          </div>
        </div>

        {/* Column 3: Live Real-Time Activity Stream */}
        <div className="lg:col-span-1">
          <LiveActivityStream />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
