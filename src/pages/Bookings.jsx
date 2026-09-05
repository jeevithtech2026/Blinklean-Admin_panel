import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, RefreshCw, AlertTriangle, WifiOff, ListOrdered, CheckCircle, Clock } from 'lucide-react';
import axiosInstance from '../api/axiosInstance';
import BookingsTable from '../components/BookingsTable';
import BookingFilter from '../components/BookingFilter';

const fallbackBookings = [
  { bookingId: 'BK-9821', customerName: 'Sarah Jenkins', customerPhone: '+91 98450 11223', serviceName: 'House Deep Cleaning', subService: '3BHK Comprehensive Sanitization', amount: 3499, status: 'confirmed', assignedPartnerName: 'Marcus Vance', assignedPartnerPhone: '+91 98450 99881', date: '2026-09-05', time: '10:00 AM', paymentMethod: 'UPI / Online', createdAt: '2026-09-05T08:30:00Z' },
  { bookingId: 'BK-9820', customerName: 'David Miller', customerPhone: '+91 98451 22334', serviceName: 'Vehicle Cleaning', subService: 'SUV Foam Wash & Interior Detailing', amount: 1299, status: 'assigned', assignedPartnerName: 'Aisha Rahman', assignedPartnerPhone: '+91 98451 88772', date: '2026-09-05', time: '11:30 AM', paymentMethod: 'Razorpay / Card', createdAt: '2026-09-05T09:00:00Z' },
  { bookingId: 'BK-9819', customerName: 'Elena Rostova', customerPhone: '+91 98452 33445', serviceName: 'Kitchen Deep Clean', subService: 'Degreasing & Chimney Sanitization', amount: 1899, status: 'completed', assignedPartnerName: 'John Sterling', assignedPartnerPhone: '+91 98452 77663', date: '2026-09-04', time: '02:00 PM', paymentMethod: 'UPI / GPay', createdAt: '2026-09-04T12:00:00Z' },
  { bookingId: 'BK-9818', customerName: 'Michael Chen', customerPhone: '+91 98453 44556', serviceName: 'House Deep Cleaning', subService: '2BHK Move-in Deep Clean', amount: 2799, status: 'pending', assignedPartnerName: '', assignedPartnerPhone: '', date: '2026-09-05', time: '04:00 PM', paymentMethod: 'Cash on Service', createdAt: '2026-09-05T09:45:00Z' },
  { bookingId: 'BK-9817', customerName: 'Amanda Ross', customerPhone: '+91 98454 55667', serviceName: 'Vehicle Cleaning', subService: 'Sedan Exterior Steam Wash', amount: 899, status: 'in-progress', assignedPartnerName: 'Carlos Mendez', assignedPartnerPhone: '+91 98453 66554', date: '2026-09-05', time: '01:00 PM', paymentMethod: 'UPI / PhonePe', createdAt: '2026-09-05T10:15:00Z' },
  { bookingId: 'BK-9816', customerName: 'Anil Kumble', customerPhone: '+91 98455 66778', serviceName: 'Bathroom Deep Clean', subService: 'Tile Descaling & Stain Removal', amount: 999, status: 'completed', assignedPartnerName: 'Zoe Winters', assignedPartnerPhone: '+91 98454 55443', date: '2026-09-04', time: '05:30 PM', paymentMethod: 'Card / NetBanking', createdAt: '2026-09-04T14:30:00Z' },
  { bookingId: 'BK-9815', customerName: 'Rashmi Verma', customerPhone: '+91 98456 77889', serviceName: 'Sofa & Upholstery Cleaning', subService: '5-Seater Shampoo Treatment', amount: 1599, status: 'confirmed', assignedPartnerName: 'Kevin Hart', assignedPartnerPhone: '+91 98455 44332', date: '2026-09-06', time: '09:30 AM', paymentMethod: 'UPI', createdAt: '2026-09-05T11:00:00Z' },
];

const Bookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      setIsOffline(false);

      const response = await axiosInstance.get('/api/v1/data/bookings');

      if (response.data?.data && response.data.data.length > 0) {
        console.log('[Bookings] Successfully retrieved bookings from backend:', response.data);
        setBookings(response.data.data);
      } else {
        console.log('[Bookings] Backend returned empty dataset, using fallback demo bookings.');
        setBookings(fallbackBookings);
      }
    } catch (error) {
      console.warn(`[Bookings API Error] /api/v1/data/bookings failed. Reverting to fallback demo bookings.`, error.message);
      setIsOffline(true);
      setErrorMsg(`Gateway Connection Failure: ${error.message || 'Offline'}. Displaying fallback service bookings.`);
      setBookings(fallbackBookings);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // Derived Metrics (filtered by category)
  const isHouseCleaning = (serviceName) => /house|home|deep|kitchen|bathroom|cleaning|sofa/i.test(serviceName) && !/vehicle|car|bike|wash/i.test(serviceName);
  const isVehicleCleaning = (serviceName) => /vehicle|car|bike|wash/i.test(serviceName);

  const filteredBookings = bookings.filter(b => {
    if (selectedCategory === 'All') return true;
    const name = b.serviceName || '';
    if (selectedCategory === 'House Cleaning') return isHouseCleaning(name);
    if (selectedCategory === 'Vehicle Cleaning') return isVehicleCleaning(name);
    return true;
  });

  const activeCount = filteredBookings.filter(b => ['confirmed', 'assigned', 'on-the-way', 'in-progress'].includes((b.status || '').toLowerCase())).length;
  const pendingCount = filteredBookings.filter(b => (b.status || '').toLowerCase() === 'pending').length;
  const completedCount = filteredBookings.filter(b => (b.status || '').toLowerCase() === 'completed').length;
  const totalBookings = filteredBookings.length;

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Service Bookings Management</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Manage, track, assign partners, and review customer service requests across all categories.</p>
        </div>

        <div className="flex items-center gap-3 flex-wrap justify-end">
          <BookingFilter selectedCategory={selectedCategory} onChange={setSelectedCategory} />
          
          {isOffline && (
            <div className="flex items-center gap-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 px-3.5 py-2 text-xs font-bold text-amber-700 dark:text-amber-500 border border-amber-100/50 dark:border-amber-900/40 shadow-xs">
              <WifiOff className="h-4 w-4 shrink-0" />
              <span>Offline Database Active</span>
            </div>
          )}
          <button
            onClick={fetchBookings}
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
                `${totalBookings} Total`
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
            <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Active Bookings</span>
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
        <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-12 text-center text-slate-500">
          <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-violet-500" />
          <p className="text-sm font-semibold">Querying Service Bookings Registry...</p>
        </div>
      ) : (
        <BookingsTable bookings={filteredBookings} />
      )}
    </div>
  );
};

export default Bookings;
