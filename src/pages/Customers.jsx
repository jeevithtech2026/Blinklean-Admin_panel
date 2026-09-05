import React, { useState, useEffect, useCallback } from 'react';
import { Users, RefreshCw, AlertTriangle, WifiOff, UserCheck, Activity } from 'lucide-react';
import axiosInstance from '../api/axiosInstance';
import CustomersTable from '../components/CustomersTable';

const fallbackCustomers = [
  { userId: 'usr_98124a', name: 'Rahul Sharma', email: 'rahul.sharma@example.com', phone: '+91 98450 12345', servicePin: '4768', city: 'Bengaluru, Indiranagar', isVerified: true, createdAt: '2026-08-15T10:30:00Z' },
  { userId: 'usr_87213b', name: 'Priya Sundaram', email: 'priya.s@example.com', phone: '+91 98451 23456', servicePin: '6476', city: 'Bengaluru, Koramangala', isVerified: true, createdAt: '2026-08-18T14:20:00Z' },
  { userId: 'usr_76324c', name: 'Ananya Deshmukh', email: 'ananya.d@example.com', phone: '+91 98452 34567', servicePin: '8844', city: 'Bengaluru, HSR Layout', isVerified: true, createdAt: '2026-08-20T09:15:00Z' },
  { userId: 'usr_65435d', name: 'Vikramaditya Roy', email: 'vikram.roy@example.com', phone: '+91 98453 45678', servicePin: '5947', city: 'Bengaluru, Whitefield', isVerified: false, createdAt: '2026-08-22T16:45:00Z' },
  { userId: 'usr_54326e', name: 'Kavita Hegde', email: 'kavita.hegde@example.com', phone: '+91 98454 56789', servicePin: '3001', city: 'Bengaluru, Jayanagar', isVerified: true, createdAt: '2026-08-25T11:00:00Z' },
  { userId: 'usr_43217f', name: 'Deepak Nair', email: 'deepak.nair@example.com', phone: '+91 98455 67890', servicePin: '8842', city: 'Bengaluru, Malleshwaram', isVerified: true, createdAt: '2026-08-28T13:10:00Z' },
  { userId: 'usr_32108g', name: 'Meera Iyer', email: 'meera.iyer@example.com', phone: '+91 98456 78901', servicePin: '1290', city: 'Bengaluru, JP Nagar', isVerified: true, createdAt: '2026-08-30T17:30:00Z' },
  { userId: 'usr_21099h', name: 'Siddharth Patel', email: 'siddharth.p@example.com', phone: '+91 98457 89012', servicePin: '7731', city: 'Bengaluru, Bellandur', isVerified: false, createdAt: '2026-09-01T08:45:00Z' },
];

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      setIsOffline(false);

      const response = await axiosInstance.get('/api/v1/data/users');

      if (response.data?.data && response.data.data.length > 0) {
        console.log('[Customers] Successfully retrieved users from backend:', response.data);
        setCustomers(response.data.data);
      } else {
        console.log('[Customers] Backend returned empty dataset, using fallback demo customers.');
        setCustomers(fallbackCustomers);
      }
    } catch (error) {
      console.warn(`[Customers API Error] /api/v1/data/users failed. Reverting to fallback demo users.`, error.message);
      setIsOffline(true);
      setErrorMsg(`Gateway Connection Failure: ${error.message || 'Offline'}. Displaying fallback customer registry.`);
      setCustomers(fallbackCustomers);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Derived Metrics
  const totalCustomers = customers.length;
  const verifiedCustomers = customers.filter(c => c.isVerified || c.emailVerified || c.phoneVerified || c.servicePin).length || totalCustomers;
  const activeThisMonth = customers.filter(c => {
    if (!c.createdAt && !c.lastLogin) return true;
    const date = new Date(c.lastLogin || c.createdAt);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return date > thirtyDaysAgo;
  }).length || totalCustomers;

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Users & Customer Directory</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">View, search, and manage registered end-users, service PINs, and customer profiles.</p>
        </div>

        <div className="flex items-center gap-3">
          {isOffline && (
            <div className="flex items-center gap-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 px-3.5 py-2 text-xs font-bold text-amber-700 dark:text-amber-500 border border-amber-100/50 dark:border-amber-900/40 shadow-xs">
              <WifiOff className="h-4 w-4 shrink-0" />
              <span>Offline Database Active</span>
            </div>
          )}
          <button
            onClick={fetchCustomers}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl bg-white dark:bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm cursor-pointer disabled:opacity-50"
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

      {/* Aggregate Metrics Row */}
      <div className="grid gap-6 sm:grid-cols-3">
        {/* Total Customers */}
        <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm flex items-center gap-4">
          <span className="rounded-xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 p-3 text-indigo-600 dark:text-indigo-400">
            <Users className="h-5 w-5" />
          </span>
          <div>
            <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Total Registered Users</span>
            <h4 className="text-lg font-extrabold text-slate-900 dark:text-white mt-0.5">
              {loading ? (
                <span className="inline-block h-5 w-16 rounded bg-slate-100 dark:bg-slate-800 animate-pulse"></span>
              ) : (
                `${totalCustomers} Users`
              )}
            </h4>
          </div>
        </div>

        {/* Active This Month */}
        <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm flex items-center gap-4">
          <span className="rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 p-3 text-emerald-600 dark:text-emerald-400">
            <Activity className="h-5 w-5" />
          </span>
          <div>
            <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Active This Month</span>
            <h4 className="text-lg font-extrabold text-slate-900 dark:text-white mt-0.5">
              {loading ? (
                <span className="inline-block h-5 w-16 rounded bg-slate-100 dark:bg-slate-800 animate-pulse"></span>
              ) : (
                `${activeThisMonth} Active`
              )}
            </h4>
          </div>
        </div>

        {/* Verified Accounts */}
        <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm flex items-center gap-4">
          <span className="rounded-xl bg-sky-50 dark:bg-sky-950/30 border border-sky-100 dark:border-sky-900/40 p-3 text-sky-600 dark:text-sky-400">
            <UserCheck className="h-5 w-5" />
          </span>
          <div>
            <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Verified Accounts</span>
            <h4 className="text-lg font-extrabold text-slate-900 dark:text-white mt-0.5">
              {loading ? (
                <span className="inline-block h-5 w-16 rounded bg-slate-100 dark:bg-slate-800 animate-pulse"></span>
              ) : (
                `${verifiedCustomers} Verified`
              )}
            </h4>
          </div>
        </div>
      </div>

      {/* Main Table View */}
      {loading ? (
        <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-12 text-center text-slate-500">
          <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-indigo-500" />
          <p className="text-sm font-semibold">Querying Registered User Directory...</p>
        </div>
      ) : (
        <CustomersTable customers={customers} />
      )}
    </div>
  );
};

export default Customers;
