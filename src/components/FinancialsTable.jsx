import React, { useState, useMemo, useEffect } from 'react';
import { ShieldAlert, ArrowUpDown, ChevronLeft, ChevronRight, Search, CheckCircle, Clock, XCircle, CreditCard, Receipt } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import ExportButton from './ExportButton';

const FinancialsTable = ({ bookings }) => {
  const { density } = useTheme();

  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, bookings.length]);

  const getStatusBadge = (status) => {
    const s = (status || '').toLowerCase();
    switch (s) {
      case 'confirmed':
      case 'completed':
        return <span className="inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[10px] font-bold border bg-emerald-50 text-emerald-700 border-emerald-100"><CheckCircle className="h-3 w-3" />Paid</span>;
      case 'pending':
        return <span className="inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[10px] font-bold border bg-amber-50 text-amber-700 border-amber-100"><Clock className="h-3 w-3" />Pending</span>;
      case 'cancelled':
      case 'failed':
        return <span className="inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[10px] font-bold border bg-rose-50 text-rose-700 border-rose-100"><XCircle className="h-3 w-3" />Refunded / Failed</span>;
      default:
        return <span className="inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[10px] font-bold border bg-slate-50 text-slate-600 border-slate-100"><Clock className="h-3 w-3" />{status || 'Unknown'}</span>;
    }
  };

  const filteredBookings = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return bookings;
    return bookings.filter((b) =>
      (b.customerName || '').toLowerCase().includes(query) ||
      (b.bookingId || '').toLowerCase().includes(query) ||
      (b.paymentId || b.razorpayPaymentId || '').toLowerCase().includes(query) ||
      (b.paymentMethod || '').toLowerCase().includes(query)
    );
  }, [bookings, searchQuery]);

  const sortedBookings = useMemo(() => {
    if (!sortField || !sortDirection) return filteredBookings;
    return [...filteredBookings].sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];
      
      if (sortField === 'amount') {
        valA = Number(valA) || 0;
        valB = Number(valB) || 0;
      } else {
        valA = (valA || '').toString().toLowerCase();
        valB = (valB || '').toString().toLowerCase();
      }

      if (sortDirection === 'asc') return valA < valB ? -1 : valA > valB ? 1 : 0;
      return valA > valB ? -1 : valA < valB ? 1 : 0;
    });
  }, [filteredBookings, sortField, sortDirection]);

  const paginatedBookings = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return sortedBookings.slice(start, start + rowsPerPage);
  }, [sortedBookings, currentPage, rowsPerPage]);

  const totalPages = Math.max(1, Math.ceil(sortedBookings.length / rowsPerPage));

  const handleSort = (field) => {
    if (sortField !== field) { setSortField(field); setSortDirection('asc'); }
    else if (sortDirection === 'asc') setSortDirection('desc');
    else { setSortField(null); setSortDirection(null); }
  };

  const renderSortIndicator = (field) => {
    if (sortField !== field) return <ArrowUpDown className="h-3 w-3 text-slate-300 dark:text-slate-600" />;
    return sortDirection === 'asc' ? <span className="text-violet-600">▲</span> : <span className="text-violet-600">▼</span>;
  };

  const exportData = async () => {
    return filteredBookings.map(b => ({
      Booking_ID: b.bookingId,
      Customer_Name: b.customerName,
      Service: b.serviceName,
      Amount: b.amount || 0,
      Payment_Method: b.paymentMethod || 'Unknown',
      Razorpay_Payment_ID: b.paymentId || b.razorpayPaymentId || 'N/A',
      Payment_Status: b.status,
      Date: b.date || b.createdAt || ''
    }));
  };

  const isCompact = density === 'compact';
  const thPadding = isCompact ? 'px-4 py-2.5 text-[10px]' : 'px-6 py-4 text-xs';
  const tdPadding = isCompact ? 'px-4 py-2' : 'px-6 py-4';
  const bodyTextSize = isCompact ? 'text-xs' : 'text-sm';
  const avatarSize = isCompact ? 'h-7 w-7 text-xs rounded-lg' : 'h-9 w-9 text-sm rounded-xl';

  return (
    <div className="space-y-4">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Search className="h-4.5 w-4.5 text-slate-400 dark:text-slate-500 shrink-0" />
          <input
            type="text"
            placeholder="Search by ID, Name, or Razorpay ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-80 bg-transparent text-sm text-slate-700 dark:text-slate-350 outline-none placeholder-slate-400 dark:placeholder-slate-600"
          />
        </div>
        <ExportButton type="Financials" getData={exportData} />
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/75 dark:bg-slate-850/50 border-b border-slate-100 dark:border-slate-800 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider select-none">
                <th className={thPadding}>Booking Details</th>
                <th className={thPadding} onClick={() => handleSort('amount')}>
                  <div className="flex items-center gap-1.5 cursor-pointer">Amount Collected {renderSortIndicator('amount')}</div>
                </th>
                <th className={thPadding}>Payment Method</th>
                <th className={thPadding}>Razorpay/Txn ID</th>
                <th className={thPadding} onClick={() => handleSort('status')}>
                  <div className="flex items-center gap-1.5 cursor-pointer">Payment Status {renderSortIndicator('status')}</div>
                </th>
              </tr>
            </thead>
            <tbody className={`divide-y divide-slate-100 dark:divide-slate-800 ${bodyTextSize}`}>
              {paginatedBookings.length > 0 ? (
                paginatedBookings.map((booking) => (
                  <tr key={booking.bookingId} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/30 transition-colors">
                    <td className={tdPadding}>
                      <div className="flex items-center gap-3">
                        <div className={`flex items-center justify-center bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 font-bold text-emerald-700 dark:text-emerald-400 ${avatarSize}`}>
                          {(booking.customerName || '?').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white leading-tight">{booking.customerName || '—'}</div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] font-mono font-semibold text-slate-500">{booking.bookingId}</span>
                            <span className="text-[10px] text-slate-300">•</span>
                            <span className="text-[10px] text-slate-500">{booking.serviceName || 'Unknown Service'}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className={tdPadding}>
                      <div className="font-extrabold text-slate-900 dark:text-white">
                        {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(booking.amount || 0)}
                      </div>
                    </td>
                    <td className={tdPadding}>
                      <div className="flex items-center gap-1.5 font-medium text-slate-600 dark:text-slate-300">
                        <CreditCard className="h-3.5 w-3.5 text-slate-400" />
                        <span className="capitalize">{booking.paymentMethod || 'Unknown'}</span>
                      </div>
                    </td>
                    <td className={tdPadding}>
                      <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                        <Receipt className="h-3.5 w-3.5 text-slate-400" />
                        {booking.paymentId || booking.razorpayPaymentId || <span className="text-slate-400 italic">N/A</span>}
                      </div>
                    </td>
                    <td className={tdPadding}>{getStatusBadge(booking.status)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-400 dark:text-slate-500">
                    <div className="flex flex-col items-center gap-3">
                      <ShieldAlert className="h-9 w-9 text-slate-300 dark:text-slate-700" />
                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-300">No records found</h4>
                      <p className="text-xs text-slate-500 max-w-xs mx-auto leading-normal">
                        No financial records match your current search criteria.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="border-t border-slate-100 dark:border-slate-800 px-6 py-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-slate-50/50 dark:bg-slate-850/20 text-xs font-semibold text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-4">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Rows per page:</span>
            <select
              value={rowsPerPage}
              onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
              className="bg-transparent font-bold text-slate-700 dark:text-slate-350 outline-none cursor-pointer border border-slate-200 dark:border-slate-800 px-2.5 py-1 rounded-lg"
            >
              {[5, 10, 25, 50].map((size) => (
                <option key={size} value={size} className="bg-white dark:bg-slate-900">{size} rows</option>
              ))}
            </select>
          </div>
          <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
            <span>Page <span className="font-bold text-slate-800 dark:text-slate-200">{currentPage}</span> of <span className="font-bold text-slate-800 dark:text-slate-200">{totalPages}</span> ({sortedBookings.length} records)</span>
            <div className="flex items-center gap-1.5">
              <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="flex items-center justify-center p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 disabled:opacity-40 cursor-pointer">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="flex items-center justify-center p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 disabled:opacity-40 cursor-pointer">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialsTable;
