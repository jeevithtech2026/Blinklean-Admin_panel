import React, { useState, useEffect } from 'react';
import { Calendar, RefreshCw, AlertTriangle, WifiOff, ListOrdered, CheckCircle, Clock } from 'lucide-react';
import axiosInstance from '../api/axiosInstance';
import BookingsTable from '../components/BookingsTable';

const Bookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Derived Metrics
  const activeCount = bookings.filter(b => ['confirmed', 'assigned', 'on-the-way', 'in-progress'].includes((b.status || '').toLowerCase())).length;
  const pendingCount = bookings.filter(b => (b.status || '').toLowerCase() === 'pending').length;
  const completedCount = bookings.filter(b => (b.status || '').toLowerCase() === 'completed').length;
  const totalBookings = bookings.length;

  useEffect(() => {
    let isMounted = true;
    const fetchBookings = async () => {
      try {
        setLoading(true);
        setErrorMsg('');
        setIsOffline(false);

        const response = await axiosInstance.get('/api/v1/data/bookings');

        if (isMounted && response.data?.data) {
          console.log('[Bookings] Successfully retrieved bookings from DynamoDB:', response.data);
          setBookings(response.data.data);
        }
      } catch (error) {
        console.warn(`[Bookings API Error] /api/v1/data/bookings failed.`, error.message);
        if (isMounted) {
          setIsOffline(true);
          setErrorMsg(`Failed to connect to backend: ${error.message}`);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchBookings();

    return () => { isMounted = false; };
  }, []);

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Service Bookings</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Manage, track, and review all customer service requests across regions.</p>
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
      <div className="grid gap-6 sm:grid-cols-4">
        {/* Total Bookings */}
        <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm flex items-center gap-4">
          <span className="rounded-xl bg-violet-50 dark:bg-violet-950/30 border border-violet-100 dark:border-violet-900/40 p-3 text-violet-600 dark:text-violet-400">
            <ListOrdered className="h-5 w-5" />
          </span>
          <div>
            <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Total Bookings</span>
            <h4 className="text-lg font-extrabold text-slate-900 dark:text-white mt-0.5">
              {loading ? (
                <span className="inline-block h-5 w-16 rounded bg-slate-100 dark:bg-slate-800 animate-pulse"></span>
              ) : (
                `${totalBookings}`
              )}
            </h4>
          </div>
        </div>

        {/* Active Bookings */}
        <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm flex items-center gap-4">
          <span className="rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 p-3 text-blue-600 dark:text-blue-400">
            <Calendar className="h-5 w-5" />
          </span>
          <div>
            <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Active Today</span>
            <h4 className="text-lg font-extrabold text-slate-900 dark:text-white mt-0.5">
              {loading ? (
                <span className="inline-block h-5 w-16 rounded bg-slate-100 dark:bg-slate-800 animate-pulse"></span>
              ) : (
                `${activeCount} Active`
              )}
            </h4>
          </div>
        </div>

        {/* Pending Bookings */}
        <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm flex items-center gap-4">
          <span className="rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/40 p-3 text-amber-600 dark:text-amber-500">
            <Clock className="h-5 w-5" />
          </span>
          <div>
            <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Pending Assignment</span>
            <h4 className="text-lg font-extrabold text-slate-900 dark:text-white mt-0.5">
              {loading ? (
                <span className="inline-block h-5 w-16 rounded bg-slate-100 dark:bg-slate-800 animate-pulse"></span>
              ) : (
                `${pendingCount} Pending`
              )}
            </h4>
          </div>
        </div>

        {/* Completed Bookings */}
        <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm flex items-center gap-4">
          <span className="rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 p-3 text-emerald-600 dark:text-emerald-400">
            <CheckCircle className="h-5 w-5" />
          </span>
          <div>
            <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Completed</span>
            <h4 className="text-lg font-extrabold text-slate-900 dark:text-white mt-0.5">
              {loading ? (
                <span className="inline-block h-5 w-16 rounded bg-slate-100 dark:bg-slate-800 animate-pulse"></span>
              ) : (
                `${completedCount} Done`
              )}
            </h4>
          </div>
        </div>
      </div>

      {/* Main Table View */}
      {loading ? (
        <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-6 text-center text-slate-500">
          <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-violet-500" />
          <p className="text-sm font-semibold">Loading real-time bookings from AWS DynamoDB...</p>
        </div>
      ) : (
        <BookingsTable bookings={bookings} />
      )}
    </div>
  );
};

export default Bookings;
