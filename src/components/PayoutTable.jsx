import React, { useState, useMemo, useEffect } from 'react';
import { ShieldAlert, ArrowUpDown, ChevronLeft, ChevronRight, Search, Building2, CreditCard, Loader2 } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import BankDetailsModal from './BankDetailsModal';
import axiosInstance from '../api/axiosInstance';

const PayoutTable = ({ partners, onPayoutProcessed }) => {
  const { density } = useTheme();

  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [processingPayout, setProcessingPayout] = useState(null); // Partner ID being processed

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, partners.length]);

  const filteredPartners = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return partners;
    return partners.filter((p) =>
      (p.name || '').toLowerCase().includes(query) ||
      (p.id || '').toLowerCase().includes(query)
    );
  }, [partners, searchQuery]);

  const sortedPartners = useMemo(() => {
    if (!sortField || !sortDirection) return filteredPartners;
    return [...filteredPartners].sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];
      
      // Calculate pending amount for sorting if needed
      if (sortField === 'pendingAmount') {
        valA = (a.earnings || 0) - (a.paidAmount || 0);
        valB = (b.earnings || 0) - (b.paidAmount || 0);
      }

      valA = valA || 0;
      valB = valB || 0;

      if (sortDirection === 'asc') return valA < valB ? -1 : valA > valB ? 1 : 0;
      return valA > valB ? -1 : valA < valB ? 1 : 0;
    });
  }, [filteredPartners, sortField, sortDirection]);

  const paginatedPartners = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return sortedPartners.slice(start, start + rowsPerPage);
  }, [sortedPartners, currentPage, rowsPerPage]);

  const totalPages = Math.max(1, Math.ceil(sortedPartners.length / rowsPerPage));

  const handleSort = (field) => {
    if (sortField !== field) { setSortField(field); setSortDirection('asc'); }
    else if (sortDirection === 'asc') setSortDirection('desc');
    else { setSortField(null); setSortDirection(null); }
  };

  const renderSortIndicator = (field) => {
    if (sortField !== field) return <ArrowUpDown className="h-3 w-3 text-slate-300 dark:text-slate-600" />;
    return sortDirection === 'asc' ? <span className="text-violet-600">▲</span> : <span className="text-violet-600">▼</span>;
  };

  const handleProcessPayout = async (partner, pendingAmount) => {
    if (!partner.bankDetails || !partner.bankDetails.accountNumber) {
      alert("Cannot process payout: Missing Bank Details. Please add them first.");
      return;
    }
    
    if (window.confirm(`Are you sure you want to process a payout of ₹${pendingAmount.toFixed(2)} to ${partner.name}?`)) {
      setProcessingPayout(partner.id);
      try {
        await axiosInstance.post(`/api/v1/data/partners/${partner.id}/payout`, { amount: pendingAmount });
        if (onPayoutProcessed) onPayoutProcessed(partner.id, pendingAmount);
      } catch (err) {
        alert(err.response?.data?.error || err.message || "Failed to process payout.");
      } finally {
        setProcessingPayout(null);
      }
    }
  };

  const isCompact = density === 'compact';
  const thPadding = isCompact ? 'px-4 py-2.5 text-[10px]' : 'px-6 py-4 text-xs';
  const tdPadding = isCompact ? 'px-4 py-2' : 'px-6 py-4';
  const bodyTextSize = isCompact ? 'text-xs' : 'text-sm';
  const avatarSize = isCompact ? 'h-7 w-7 text-xs rounded-lg' : 'h-9 w-9 text-sm rounded-xl';

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm flex items-center gap-3">
        <Search className="h-4.5 w-4.5 text-slate-400 dark:text-slate-500 shrink-0" />
        <input
          type="text"
          placeholder="Search partners by name or ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-transparent text-sm text-slate-700 dark:text-slate-350 outline-none placeholder-slate-400 dark:placeholder-slate-600"
        />
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/75 dark:bg-slate-850/50 border-b border-slate-100 dark:border-slate-800 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider select-none">
                <th className={thPadding}>Partner</th>
                <th className={thPadding}>Bank Details (Secure)</th>
                <th className={`${thPadding} text-right`} onClick={() => handleSort('earnings')}>
                  <div className="flex items-center justify-end gap-1.5 cursor-pointer">Total Earnings {renderSortIndicator('earnings')}</div>
                </th>
                <th className={`${thPadding} text-right`} onClick={() => handleSort('paidAmount')}>
                  <div className="flex items-center justify-end gap-1.5 cursor-pointer">Paid {renderSortIndicator('paidAmount')}</div>
                </th>
                <th className={`${thPadding} text-right`} onClick={() => handleSort('pendingAmount')}>
                  <div className="flex items-center justify-end gap-1.5 cursor-pointer">Pending {renderSortIndicator('pendingAmount')}</div>
                </th>
                <th className={`${thPadding} text-center`}>Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y divide-slate-100 dark:divide-slate-800 ${bodyTextSize}`}>
              {paginatedPartners.length > 0 ? (
                paginatedPartners.map((partner) => {
                  const earnings = Number(partner.earnings) || 0;
                  const paidAmount = Number(partner.paidAmount) || 0;
                  const pendingAmount = earnings - paidAmount;
                  const hasBankDetails = partner.bankDetails && partner.bankDetails.accountNumber;
                  const canPay = pendingAmount > 0;

                  return (
                    <tr key={partner.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/30 transition-colors">
                      {/* Partner Name */}
                      <td className={tdPadding}>
                        <div className="flex items-center gap-3">
                          <div className={`flex items-center justify-center bg-violet-50 dark:bg-violet-950/30 border border-violet-100 dark:border-violet-900/40 font-bold text-violet-700 dark:text-violet-400 ${avatarSize}`}>
                            {(partner.name || '?').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white leading-tight">{partner.name || '—'}</div>
                            <div className="text-[10px] font-mono text-slate-400 dark:text-slate-500 mt-0.5">{partner.id}</div>
                          </div>
                        </div>
                      </td>
                      
                      {/* Bank Details */}
                      <td className={tdPadding}>
                        {hasBankDetails ? (
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-700 dark:text-slate-300">{partner.bankDetails.bankName || 'Unknown Bank'}</span>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] font-mono text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                                ************{partner.bankDetails.accountNumber.slice(-4)}
                              </span>
                              <button 
                                onClick={() => { setSelectedPartner(partner); setIsBankModalOpen(true); }}
                                className="text-[10px] font-bold text-violet-600 hover:text-violet-700"
                              >
                                Edit
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button 
                            onClick={() => { setSelectedPartner(partner); setIsBankModalOpen(true); }}
                            className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-amber-50 text-amber-700 text-[10px] font-bold border border-amber-100 hover:bg-amber-100 transition-colors"
                          >
                            <Building2 className="h-3 w-3" />
                            Add Bank Details
                          </button>
                        )}
                      </td>

                      {/* Earnings */}
                      <td className={`${tdPadding} text-right font-bold text-slate-700 dark:text-slate-300`}>
                        ₹{earnings.toFixed(2)}
                      </td>
                      
                      {/* Paid */}
                      <td className={`${tdPadding} text-right font-bold text-emerald-600 dark:text-emerald-500`}>
                        ₹{paidAmount.toFixed(2)}
                      </td>

                      {/* Pending */}
                      <td className={`${tdPadding} text-right font-bold text-amber-600 dark:text-amber-500`}>
                        ₹{pendingAmount.toFixed(2)}
                      </td>

                      {/* Actions */}
                      <td className={`${tdPadding} text-center`}>
                        <button 
                          disabled={!canPay || processingPayout === partner.id}
                          onClick={() => handleProcessPayout(partner, pendingAmount)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            canPay 
                              ? 'bg-violet-600 hover:bg-violet-700 text-white shadow-sm' 
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                          }`}
                        >
                          {processingPayout === partner.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <CreditCard className="h-3.5 w-3.5" />
                          )}
                          Pay Now
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-400 dark:text-slate-500">
                    <div className="flex flex-col items-center gap-3">
                      <ShieldAlert className="h-9 w-9 text-slate-300 dark:text-slate-700" />
                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-300">No records found</h4>
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
              {[5, 10, 25].map((size) => (
                <option key={size} value={size} className="bg-white dark:bg-slate-900">{size} rows</option>
              ))}
            </select>
          </div>
          <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
            <span>Page <span className="font-bold text-slate-800 dark:text-slate-200">{currentPage}</span> of <span className="font-bold text-slate-800 dark:text-slate-200">{totalPages}</span></span>
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

      <BankDetailsModal 
        isOpen={isBankModalOpen}
        onClose={() => setIsBankModalOpen(false)}
        partner={selectedPartner}
        onUpdate={(id, newBankDetails) => {
          if (selectedPartner && selectedPartner.id === id) {
            selectedPartner.bankDetails = newBankDetails;
          }
        }}
      />
    </div>
  );
};

export default PayoutTable;
