import React, { useState, useEffect } from 'react';
import { ShieldAlert } from 'lucide-react';
import axiosInstance from '../api/axiosInstance';

const CompletedBookingsList = ({ loading: parentLoading }) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchBookings = async () => {
      try {
        const response = await axiosInstance.get('/api/v1/data/bookings');
        if (isMounted && response.data?.data) {
          const completed = response.data.data.filter(
            b => (b.status || '').toLowerCase() === 'completed'
          );
          // Get the latest 5 completed bookings
          setBookings(completed.slice(0, 5));
        }
      } catch (err) {
        console.warn('[CompletedBookingsList] Failed to fetch completed bookings:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchBookings();
    return () => { isMounted = false; };
  }, []);

  if (parentLoading || loading) {
    return (
      <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm animate-pulse space-y-4 h-full">
        <div className="space-y-2">
          <div className="h-5 w-40 rounded bg-slate-200 dark:bg-slate-800"></div>
          <div className="h-3 w-60 rounded bg-slate-100 dark:bg-slate-800/50"></div>
        </div>
        <div className="space-y-3 pt-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-10 w-full rounded bg-slate-50 dark:bg-slate-950"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden flex flex-col h-full justify-between">
      <div className="px-6 py-5 border-b border-slate-50 dark:border-slate-850">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Service Bookings Done</h2>
        <p className="text-xs text-slate-400 dark:text-slate-550">Recent completed service requests from customers</p>
      </div>
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/75 dark:bg-slate-850/50 border-b border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <th className="px-6 py-4">Booking ID</th>
              <th className="px-6 py-4">Customer</th>
              <th className="px-6 py-4">Service</th>
              <th className="px-6 py-4">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
            {bookings.length > 0 ? (
              bookings.map((booking, i) => (
                <tr key={booking.bookingId || i} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/30 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs font-bold text-slate-950 dark:text-slate-200">
                    {booking.bookingId}
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-350">
                    {booking.customerName || '—'}
                  </td>
                  <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                    {booking.serviceName || '—'}
                  </td>
                  <td className="px-6 py-4 font-semibold text-emerald-600 dark:text-emerald-400">
                    {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(booking.amount || 0)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="px-6 py-12 text-center text-slate-400 dark:text-slate-500">
                  <div className="flex flex-col items-center gap-3">
                    <ShieldAlert className="h-9 w-9 text-slate-300 dark:text-slate-700" />
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-350">No completed bookings found</h4>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CompletedBookingsList;
