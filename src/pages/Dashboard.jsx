import React, { useState, useEffect, useCallback } from 'react';
import { Users, UserCheck, Calendar, CheckCircle2, BarChart3, WifiOff, AlertTriangle, MapPin } from 'lucide-react';
import KpiCard from '../components/ui/KpiCard';
import RefreshController from '../components/ui/RefreshController';
import axiosInstance from '../api/axiosInstance';

import CompletedBookingsList from '../components/CompletedBookingsList';
import DiscountCouponsPanel from '../components/DiscountCouponsPanel';
import FinancialsPaymentsPanel from '../components/FinancialsPaymentsPanel';

import Customers from './Customers';
import Partners from './Partners';
import PartnerTracking from './PartnerTracking';
import Bookings from './Bookings';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [frequency, setFrequency] = useState(0); // auto-refresh frequency in seconds, 0 = Off
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'customers' | 'partners' | 'tracking' | 'bookings'
  
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
          {activeTab === 'overview' && (
            <RefreshController 
              onRefresh={fetchDashboardSummary} 
              loading={loading}
              frequency={frequency}
              setFrequency={setFrequency}
            />
          )}
        </div>
      </div>

      {/* Network Alert Notification */}
      {errorMsg && activeTab === 'overview' && (
        <div className="flex items-start gap-3 rounded-xl bg-rose-50 border border-rose-100 dark:border-rose-900/30 p-4 text-xs font-semibold text-rose-700 dark:text-rose-450">
          <AlertTriangle className="h-4.5 w-4.5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-extrabold block">Network Communication Warning</span>
            <p className="mt-0.5 text-rose-600 dark:text-rose-450 font-medium">{errorMsg}</p>
          </div>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800/50 rounded-xl w-max border border-slate-200 dark:border-slate-800 overflow-x-auto max-w-full">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
            activeTab === 'overview'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs border border-slate-200 dark:border-slate-700'
              : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
          }`}
        >
          <BarChart3 className="h-4 w-4" /> Overview Summary
        </button>
        <button
          onClick={() => setActiveTab('customers')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
            activeTab === 'customers'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs border border-slate-200 dark:border-slate-700'
              : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
          }`}
        >
          <Users className="h-4 w-4" /> Customer Directory
        </button>
        <button
          onClick={() => setActiveTab('partners')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
            activeTab === 'partners'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs border border-slate-200 dark:border-slate-700'
              : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
          }`}
        >
          <UserCheck className="h-4 w-4" /> Partner Management
        </button>
        <button
          onClick={() => setActiveTab('tracking')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
            activeTab === 'tracking'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs border border-slate-200 dark:border-slate-700'
              : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
          }`}
        >
          <MapPin className="h-4 w-4" /> Partner Schedules
        </button>
        <button
          onClick={() => setActiveTab('bookings')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
            activeTab === 'bookings'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs border border-slate-200 dark:border-slate-700'
              : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
          }`}
        >
          <Calendar className="h-4 w-4" /> Service Bookings
        </button>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
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
              {/* Column 1: Completed Bookings */}
              <div className="lg:col-span-1">
                <CompletedBookingsList loading={loading} />
              </div>

              {/* Column 2: Promo Coupons Summary */}
              <div className="lg:col-span-1">
                <DiscountCouponsPanel loading={loading} />
              </div>

              {/* Column 3: Financials & Payments */}
              <div className="lg:col-span-1">
                <FinancialsPaymentsPanel loading={loading} />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'customers' && <Customers />}
        {activeTab === 'partners' && <Partners />}
        {activeTab === 'tracking' && <PartnerTracking />}
        {activeTab === 'bookings' && <Bookings />}
      </div>
    </div>
  );
};

export default Dashboard;
