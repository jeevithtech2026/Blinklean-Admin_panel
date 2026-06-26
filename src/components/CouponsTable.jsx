import React, { useState, useMemo, useEffect } from 'react';
import { ShieldAlert, ArrowUpDown, ChevronLeft, ChevronRight, Search, Ticket, CheckCircle, XCircle, Megaphone } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const CouponsTable = ({ coupons, onBroadcast }) => {
  const { density } = useTheme();

  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, coupons.length]);

  const filteredCoupons = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return coupons;
    return coupons.filter((c) =>
      (c.couponId || '').toLowerCase().includes(query)
    );
  }, [coupons, searchQuery]);

  const sortedCoupons = useMemo(() => {
    if (!sortField || !sortDirection) return filteredCoupons;
    return [...filteredCoupons].sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (sortField === 'discountPercentage') {
        valA = Number(valA) || 0;
        valB = Number(valB) || 0;
      } else {
        valA = (valA || '').toString().toLowerCase();
        valB = (valB || '').toString().toLowerCase();
      }

      if (sortDirection === 'asc') return valA < valB ? -1 : valA > valB ? 1 : 0;
      return valA > valB ? -1 : valA < valB ? 1 : 0;
    });
  }, [filteredCoupons, sortField, sortDirection]);

  const paginatedCoupons = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return sortedCoupons.slice(start, start + rowsPerPage);
  }, [sortedCoupons, currentPage, rowsPerPage]);

  const totalPages = Math.max(1, Math.ceil(sortedCoupons.length / rowsPerPage));

  const handleSort = (field) => {
    if (sortField !== field) { setSortField(field); setSortDirection('asc'); }
    else if (sortDirection === 'asc') setSortDirection('desc');
    else { setSortField(null); setSortDirection(null); }
  };

  const renderSortIndicator = (field) => {
    if (sortField !== field) return <ArrowUpDown className="h-3 w-3 text-slate-300 dark:text-slate-600" />;
    return sortDirection === 'asc' ? <span className="text-violet-600">▲</span> : <span className="text-violet-600">▼</span>;
  };

  const isCompact = density === 'compact';
  const thPadding = isCompact ? 'px-4 py-2.5 text-[10px]' : 'px-6 py-4 text-xs';
  const tdPadding = isCompact ? 'px-4 py-2' : 'px-6 py-4';
  const bodyTextSize = isCompact ? 'text-xs' : 'text-sm';
  const avatarSize = isCompact ? 'h-7 w-7 text-xs rounded-lg' : 'h-9 w-9 text-sm rounded-xl';

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm flex items-center gap-3">
        <Search className="h-4.5 w-4.5 text-slate-400 dark:text-slate-500 shrink-0" />
        <input
          type="text"
          placeholder="Search by Coupon Code..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-transparent text-sm text-slate-700 dark:text-slate-350 outline-none placeholder-slate-400 dark:placeholder-slate-600"
        />
      </div>

      <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/75 dark:bg-slate-850/50 border-b border-slate-100 dark:border-slate-800 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider select-none">
                <th className={thPadding} onClick={() => handleSort('couponId')}>
                  <div className="flex items-center gap-1.5 cursor-pointer">Coupon Code {renderSortIndicator('couponId')}</div>
                </th>
                <th className={thPadding} onClick={() => handleSort('discountPercentage')}>
                  <div className="flex items-center gap-1.5 cursor-pointer">Discount (%) {renderSortIndicator('discountPercentage')}</div>
                </th>
                <th className={thPadding}>Conditions</th>
                <th className={thPadding} onClick={() => handleSort('isActive')}>
                  <div className="flex items-center gap-1.5 cursor-pointer">Status {renderSortIndicator('isActive')}</div>
                </th>
                <th className={thPadding}>Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y divide-slate-100 dark:divide-slate-800 ${bodyTextSize}`}>
              {paginatedCoupons.length > 0 ? (
                paginatedCoupons.map((coupon) => (
                  <tr key={coupon.couponId || Math.random()} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/30 transition-colors">
                    <td className={tdPadding}>
                      <div className="flex items-center gap-3">
                        <div className={`flex items-center justify-center bg-orange-50 dark:bg-orange-950/30 border border-orange-100 dark:border-orange-900/40 text-orange-600 dark:text-orange-400 ${avatarSize}`}>
                          <Ticket className="h-4 w-4" />
                        </div>
                        <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">{coupon.couponId || 'N/A'}</span>
                      </div>
                    </td>
                    <td className={tdPadding}>
                      <div className="font-extrabold text-emerald-600 dark:text-emerald-400 text-lg">
                        {coupon.discountPercentage ? `${coupon.discountPercentage}%` : 'Variable'}
                      </div>
                    </td>
                    <td className={tdPadding}>
                      <div className="flex flex-col gap-1.5 mt-1">
                        {coupon.firstBookingOnly && (
                          <span className="inline-flex w-max items-center gap-1 rounded-md bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-800/50">First Booking Only</span>
                        )}
                        <div className="flex flex-wrap items-center gap-1">
                          <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 rounded-md px-1.5 py-0.5">
                            {coupon.maxUsageLimit ? `Max: ${coupon.maxUsageLimit}` : 'Total: ∞'}
                          </span>
                          <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 rounded-md px-1.5 py-0.5">
                            {coupon.usagePerUser ? `Per User: ${coupon.usagePerUser}` : 'User: ∞'}
                          </span>
                        </div>
                        {(coupon.validServices || []).length > 0 ? (
                          <span className="inline-flex w-max items-center text-[10px] font-semibold text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800/50 bg-orange-50 dark:bg-orange-900/20 rounded-md px-1.5 py-0.5">
                            {coupon.validServices.length} Specific Service{coupon.validServices.length > 1 ? 's' : ''}
                          </span>
                        ) : (
                          <span className="inline-flex w-max items-center text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50 bg-emerald-50 dark:bg-emerald-900/20 rounded-md px-1.5 py-0.5">
                            All Services
                          </span>
                        )}
                      </div>
                    </td>
                    <td className={tdPadding}>
                      {coupon.isActive ? (
                        <span className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold border bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/40">
                          <CheckCircle className="h-3.5 w-3.5" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold border bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700">
                          <XCircle className="h-3.5 w-3.5" /> Inactive
                        </span>
                      )}
                    </td>
                    <td className={tdPadding}>
                      {coupon.isActive && (
                        <button
                          onClick={() => onBroadcast && onBroadcast(coupon)}
                          title="Broadcast coupon to all customers"
                          className="flex items-center gap-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 px-3 py-1.5 text-xs font-bold text-white transition-all shadow-sm active:scale-95"
                        >
                          <Megaphone className="h-3.5 w-3.5" />
                          <span>Broadcast</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-400 dark:text-slate-500">
                    <div className="flex flex-col items-center gap-3">
                      <ShieldAlert className="h-9 w-9 text-slate-300 dark:text-slate-700" />
                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-300">No records found</h4>
                      <p className="text-xs text-slate-500 max-w-xs mx-auto leading-normal">
                        No coupons match your current search criteria.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
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
            <span>Page <span className="font-bold text-slate-800 dark:text-slate-200">{currentPage}</span> of <span className="font-bold text-slate-800 dark:text-slate-200">{totalPages}</span></span>
            <div className="flex items-center gap-1.5">
              <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="flex items-center justify-center p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button>
              <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="flex items-center justify-center p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CouponsTable;
