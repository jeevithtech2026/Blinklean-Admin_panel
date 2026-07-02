import React, { useState, useEffect } from 'react';
import { IndianRupee, CheckCircle, Clock, ShieldAlert } from 'lucide-react';
import axiosInstance from '../api/axiosInstance';

const FinancialsPaymentsPanel = ({ loading: parentLoading }) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchBookings = async () => {
      try {
        const response = await axiosInstance.get('/api/v1/data/bookings');
        if (isMounted && response.data?.data) {
          setBookings(response.data.data);
        }
      } catch (err) {
        console.warn('[FinancialsPaymentsPanel] Failed to fetch bookings for financials:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchBookings();
    return () => { isMounted = false; };
  }, []);

  const totalRevenue = bookings.reduce((sum, b) => sum + (Number(b.amount) || 0), 0);
  const completedRevenue = bookings.filter(b => ['completed', 'confirmed'].includes((b.status || '').toLowerCase())).reduce((sum, b) => sum + (Number(b.amount) || 0), 0);
  const pendingRevenue = bookings.filter(b => (b.status || '').toLowerCase() === 'pending').reduce((sum, b) => sum + (Number(b.amount) || 0), 0);

  if (parentLoading || loading) {
    return (
      <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm animate-pulse space-y-4 h-full">
        <div className="space-y-2">
          <div className="h-5 w-40 rounded bg-slate-200 dark:bg-slate-800"></div>
          <div className="h-3 w-60 rounded bg-slate-100 dark:bg-slate-800/50"></div>
        </div>
        <div className="space-y-3 pt-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 w-full rounded bg-slate-50 dark:bg-slate-950"></div>
          ))}
        </div>
      </div>
    );
  }

  const inrFormatter = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

  return (
    <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm flex flex-col h-full min-h-[350px] justify-between">
      <div className="border-b border-slate-50 dark:border-slate-850 pb-4 mb-4">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Financials & Payments</h2>
        <p className="text-xs text-slate-400 dark:text-slate-550">Real-time revenue settlement metrics</p>
      </div>

      <div className="flex-1 space-y-3.5">
        <div className="flex items-center gap-3.5 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 hover:bg-white dark:hover:bg-slate-900 transition-all duration-300">
          <span className="rounded-lg bg-violet-50 dark:bg-violet-950/30 border border-violet-100 dark:border-violet-900/40 p-2.5 text-violet-600 dark:text-violet-400">
            <IndianRupee className="h-4.5 w-4.5" />
          </span>
          <div>
            <span className="text-[9px] text-slate-450 font-bold block uppercase tracking-wider">Total Value</span>
            <h4 className="text-sm font-extrabold text-slate-900 dark:text-white mt-0.5">
              {inrFormatter.format(totalRevenue)}
            </h4>
          </div>
        </div>

        <div className="flex items-center gap-3.5 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 hover:bg-white dark:hover:bg-slate-900 transition-all duration-300">
          <span className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 p-2.5 text-emerald-600 dark:text-emerald-400">
            <CheckCircle className="h-4.5 w-4.5" />
          </span>
          <div>
            <span className="text-[9px] text-slate-450 font-bold block uppercase tracking-wider">Amount Paid</span>
            <h4 className="text-sm font-extrabold text-slate-900 dark:text-white mt-0.5">
              {inrFormatter.format(completedRevenue)}
            </h4>
          </div>
        </div>

        <div className="flex items-center gap-3.5 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 hover:bg-white dark:hover:bg-slate-900 transition-all duration-300">
          <span className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-100/40 dark:border-amber-900/40 p-2.5 text-amber-600 dark:text-amber-500">
            <Clock className="h-4.5 w-4.5" />
          </span>
          <div>
            <span className="text-[9px] text-slate-450 font-bold block uppercase tracking-wider">Pending Settlement</span>
            <h4 className="text-sm font-extrabold text-slate-900 dark:text-white mt-0.5">
              {inrFormatter.format(pendingRevenue)}
            </h4>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialsPaymentsPanel;
