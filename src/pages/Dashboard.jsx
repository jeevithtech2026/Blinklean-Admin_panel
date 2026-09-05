import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, UserCheck, Calendar, CheckCircle2, BarChart3, WifiOff, AlertTriangle,
  ShieldCheck, Wallet, Car, Home, Recycle, TrendingUp
} from 'lucide-react';
import KpiCard from '../components/ui/KpiCard';
import RefreshController from '../components/ui/RefreshController';
import axiosInstance from '../api/axiosInstance';
import FinancialsPaymentsPanel from '../components/FinancialsPaymentsPanel';

import Customers from './Customers';
import Partners from './Partners';
import Bookings from './Bookings';
import VerificationCodes from './VerificationCodes';
import Payouts from './Payouts';

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [frequency, setFrequency] = useState(0); // auto-refresh frequency in seconds, 0 = Off
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'customers' | 'partners' | 'bookings' | 'verification-codes' | 'payouts'
  
  const [metrics, setMetrics] = useState({
    customers: { title: 'Total Registered Users', value: '0', trend: '', isPositive: true, icon: Users },
    partners: { title: 'Total Registered Partners', value: '0', trend: '', isPositive: true, icon: UserCheck },
    bookings: { title: 'Active Bookings Today', value: '0', trend: '', isPositive: false, icon: Calendar },
    completions: { title: 'Total Completed Services', value: '0', trend: '', isPositive: true, icon: CheckCircle2 },
  });

  const [serviceBreakdown, setServiceBreakdown] = useState({
    vehicleCleaning: { count: 540, percentage: 43 },
    scrapRecycling: { count: 385, percentage: 31 },
    houseCleaning: { count: 323, percentage: 26 },
    total: 1248
  });

  const fallbackMetrics = {
    customers: { title: 'Total Registered Users', value: '12,480', trend: '+12.5%', isPositive: true, icon: Users },
    partners: { title: 'Total Registered Partners', value: '348', trend: '+4.2%', isPositive: true, icon: UserCheck },
    bookings: { title: 'Active Bookings Today', value: '95', trend: '-1.8%', isPositive: false, icon: Calendar },
    completions: { title: 'Total Completed Services', value: '1,248', trend: '+8.6%', isPositive: true, icon: CheckCircle2 },
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
          customers: { title: 'Total Registered Users', value: apiData.customers || '0', trend: apiData.customersTrend || '', isPositive: apiData.customersIsPositive !== false, icon: Users },
          partners: { title: 'Total Registered Partners', value: apiData.partners || '0', trend: apiData.partnersTrend || '', isPositive: apiData.partnersIsPositive !== false, icon: UserCheck },
          bookings: { title: 'Active Bookings Today', value: apiData.bookings || '0', trend: apiData.bookingsTrend || '', isPositive: apiData.bookingsIsPositive !== false, icon: Calendar },
          completions: { title: 'Total Completed Services', value: apiData.completions || '1,248', trend: apiData.completionsTrend || '+8.6%', isPositive: apiData.completionsIsPositive !== false, icon: CheckCircle2 },
        });

        if (apiData.serviceBreakdown) {
          setServiceBreakdown(apiData.serviceBreakdown);
        }
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
    fetchDashboardSummary();
  }, [fetchDashboardSummary]);

  // Setup auto-refresh interval based on selected frequency
  useEffect(() => {
    if (frequency <= 0) return;

    const intervalId = setInterval(() => {
      fetchDashboardSummary();
    }, frequency * 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, [frequency, fetchDashboardSummary]);

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Operations Command Center</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Monitor registered users, active partners, service bookings, and completed job metrics.</p>
        </div>

        <div className="flex items-center gap-3">
          {isOffline && (
            <div className="flex items-center gap-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 px-3.5 py-2 text-xs font-bold text-amber-700 dark:text-amber-500 border border-amber-100/50 dark:border-amber-900/40 shadow-xs">
              <WifiOff className="h-4 w-4 shrink-0" />
              <span>Offline Database Active</span>
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

      {/* Tabs Navigation (Clean 6 Core Sections) */}
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
          <Users className="h-4 w-4" /> Users Directory
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
          onClick={() => setActiveTab('bookings')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
            activeTab === 'bookings'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs border border-slate-200 dark:border-slate-700'
              : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
          }`}
        >
          <Calendar className="h-4 w-4" /> Service Bookings
        </button>
        <button
          onClick={() => setActiveTab('verification-codes')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
            activeTab === 'verification-codes'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs border border-slate-200 dark:border-slate-700'
              : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
          }`}
        >
          <ShieldCheck className="h-4 w-4" /> Verification Codes
        </button>
        <button
          onClick={() => setActiveTab('payouts')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
            activeTab === 'payouts'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs border border-slate-200 dark:border-slate-700'
              : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
          }`}
        >
          <Wallet className="h-4 w-4" /> Partner Payouts
        </button>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* KPI Cards Grid with Direct Click-to-Navigate */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <KpiCard
                title={metrics.customers.title}
                value={metrics.customers.value}
                trend={metrics.customers.trend}
                isPositive={metrics.customers.isPositive}
                icon={metrics.customers.icon}
                loading={loading}
                onClick={() => setActiveTab('customers')}
                actionLabel="View Users"
              />
              <KpiCard
                title={metrics.partners.title}
                value={metrics.partners.value}
                trend={metrics.partners.trend}
                isPositive={metrics.partners.isPositive}
                icon={metrics.partners.icon}
                loading={loading}
                onClick={() => setActiveTab('partners')}
                actionLabel="View Partners"
              />
              <KpiCard
                title={metrics.bookings.title}
                value={metrics.bookings.value}
                trend={metrics.bookings.trend}
                isPositive={metrics.bookings.isPositive}
                icon={metrics.bookings.icon}
                loading={loading}
                onClick={() => setActiveTab('bookings')}
                actionLabel="View Bookings"
              />
              <KpiCard
                title={metrics.completions.title}
                value={metrics.completions.value}
                trend={metrics.completions.trend}
                isPositive={metrics.completions.isPositive}
                icon={metrics.completions.icon}
                loading={loading}
                onClick={() => setActiveTab('bookings')}
                actionLabel="Review"
              />
            </div>

            {/* Service Category Completed Breakdown & Financials Section */}
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Completed Services Breakdown Card (2 Cols) */}
              <div className="lg:col-span-2 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-5">
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-base">Completed Services Breakdown</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Total completed jobs across Vehicle Cleaning, Scrap & Recycling, and House Cleaning.</p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/40">
                    <TrendingUp className="h-3.5 w-3.5" />
                    {metrics.completions.value} Total Jobs
                  </span>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  {/* Vehicle Cleaning */}
                  <div className="rounded-xl border border-slate-100 dark:border-slate-800 p-4 bg-slate-50/50 dark:bg-slate-850/40">
                    <div className="flex items-center justify-between mb-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-bold">
                        <Car className="h-4.5 w-4.5" />
                      </span>
                      <span className="text-xs font-bold text-slate-400">{serviceBreakdown.vehicleCleaning.percentage}%</span>
                    </div>
                    <div className="text-xl font-black text-slate-900 dark:text-white">{serviceBreakdown.vehicleCleaning.count}</div>
                    <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 mt-0.5">Vehicle Cleaning</div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full mt-3 overflow-hidden">
                      <div className="bg-blue-600 h-full rounded-full" style={{ width: `${serviceBreakdown.vehicleCleaning.percentage}%` }}></div>
                    </div>
                  </div>

                  {/* Scrap & Recycling */}
                  <div className="rounded-xl border border-slate-100 dark:border-slate-800 p-4 bg-slate-50/50 dark:bg-slate-850/40">
                    <div className="flex items-center justify-between mb-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 font-bold">
                        <Recycle className="h-4.5 w-4.5" />
                      </span>
                      <span className="text-xs font-bold text-slate-400">{serviceBreakdown.scrapRecycling.percentage}%</span>
                    </div>
                    <div className="text-xl font-black text-slate-900 dark:text-white">{serviceBreakdown.scrapRecycling.count}</div>
                    <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 mt-0.5">Scrap & Recycling</div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full mt-3 overflow-hidden">
                      <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${serviceBreakdown.scrapRecycling.percentage}%` }}></div>
                    </div>
                  </div>

                  {/* House Cleaning */}
                  <div className="rounded-xl border border-slate-100 dark:border-slate-800 p-4 bg-slate-50/50 dark:bg-slate-850/40">
                    <div className="flex items-center justify-between mb-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400 font-bold">
                        <Home className="h-4.5 w-4.5" />
                      </span>
                      <span className="text-xs font-bold text-slate-400">{serviceBreakdown.houseCleaning.percentage}%</span>
                    </div>
                    <div className="text-xl font-black text-slate-900 dark:text-white">{serviceBreakdown.houseCleaning.count}</div>
                    <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 mt-0.5">House Deep Cleaning</div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full mt-3 overflow-hidden">
                      <div className="bg-violet-600 h-full rounded-full" style={{ width: `${serviceBreakdown.houseCleaning.percentage}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Financials & Payments Panel (1 Col) */}
              <div className="lg:col-span-1">
                <FinancialsPaymentsPanel loading={loading} />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'customers' && <Customers />}
        {activeTab === 'partners' && <Partners />}
        {activeTab === 'bookings' && <Bookings />}
        {activeTab === 'verification-codes' && <VerificationCodes />}
        {activeTab === 'payouts' && <Payouts />}
      </div>
    </div>
  );
};

export default Dashboard;
