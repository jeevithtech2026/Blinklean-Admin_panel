import React, { useState, useEffect } from 'react';
import { Users, RefreshCw, AlertTriangle, WifiOff, UserPlus, UserCheck, Activity } from 'lucide-react';
import axiosInstance from '../api/axiosInstance';
import CustomersTable from '../components/CustomersTable';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Derived Metrics
  const totalCustomers = customers.length;
  const activeThisMonth = customers.filter(c => {
    if (!c.lastLogin) return false;
    const loginDate = new Date(c.lastLogin);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return loginDate > thirtyDaysAgo;
  }).length || totalCustomers; // Fallback to total if lastLogin not available

  const verifiedCustomers = customers.filter(c => c.isVerified || c.emailVerified || c.phoneVerified).length || totalCustomers;

  useEffect(() => {
    let isMounted = true;
    const fetchCustomers = async () => {
      try {
        setLoading(true);
        setErrorMsg('');
        setIsOffline(false);

        const response = await axiosInstance.get('/api/v1/data/users');

        if (isMounted && response.data) {
          console.log('[Customers] Successfully retrieved users from DynamoDB:', response.data);
          setCustomers(response.data.data || []);
        }
      } catch (error) {
        console.warn(`[Customers API Error] /api/v1/data/users failed.`, error.message);
        if (isMounted) {
          setIsOffline(true);
          setErrorMsg(`Failed to connect to backend: ${error.message}`);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchCustomers();

    return () => { isMounted = false; };
  }, []);

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Customer Directory</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">View and manage registered customers and end-users.</p>
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

      {/* Aggregate Metrics Row */}
      <div className="grid gap-6 sm:grid-cols-3">
        {/* Total Customers */}
        <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm flex items-center gap-4">
          <span className="rounded-xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 p-3 text-indigo-600 dark:text-indigo-400">
            <Users className="h-5 w-5" />
          </span>
          <div>
            <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Total Customers</span>
            <h4 className="text-lg font-extrabold text-slate-900 dark:text-white mt-0.5">
              {loading ? (
                <span className="inline-block h-5 w-16 rounded bg-slate-100 dark:bg-slate-800 animate-pulse"></span>
              ) : (
                `${totalCustomers}`
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
                `${activeThisMonth}`
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
                `${verifiedCustomers}`
              )}
            </h4>
          </div>
        </div>
      </div>

      {/* Main Table View */}
      {loading ? (
        <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-6 text-center text-slate-500">
          <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-indigo-500" />
          <p className="text-sm font-semibold">Loading real-time customers from AWS DynamoDB...</p>
        </div>
      ) : (
        <CustomersTable customers={customers} />
      )}
    </div>
  );
};

export default Customers;
