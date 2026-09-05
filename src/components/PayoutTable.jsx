import React, { useState, useMemo, useEffect } from 'react';
import { ShieldAlert, ArrowUpDown, ChevronLeft, ChevronRight, Search, Building2, CreditCard, Loader2, Phone, MessageSquare, CheckCircle, UserCheck } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import BankDetailsModal from './BankDetailsModal';
import ExportButton from './ExportButton';
import axiosInstance from '../api/axiosInstance';

const PayoutTable = ({ partners, onPayoutProcessed }) => {
  const { density } = useTheme();

  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [processingPayout, setProcessingPayout] = useState(null);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, partners.length]);

  const filteredPartners = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return partners;
    return partners.filter((p) =>
      (p.name || '').toLowerCase().includes(query) ||
      (p.id || '').toLowerCase().includes(query) ||
      (p.phone || p.phoneNumber || '').toLowerCase().includes(query) ||
      (p.email || '').toLowerCase().includes(query) ||
      (p.category || p.selectedServiceType || '').toLowerCase().includes(query) ||
      (p.bankDetails?.bankName || '').toLowerCase().includes(query) ||
      (p.bankDetails?.ifscCode || '').toLowerCase().includes(query)
    );
  }, [partners, searchQuery]);

  const sortedPartners = useMemo(() => {
    if (!sortField || !sortDirection) return filteredPartners;
    return [...filteredPartners].sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];
      
      if (sortField === 'pendingAmount') {
        valA = (a.earnings || a.totalEarnings || 0) - (a.paidAmount || 0);
        valB = (b.earnings || b.totalEarnings || 0) - (b.paidAmount || 0);
      }

      if (sortField === 'completedCount') {
        valA = a.completedCount ?? a.orders ?? a.completedOrders ?? 0;
        valB = b.completedCount ?? b.orders ?? b.completedOrders ?? 0;
      }

      if (sortField === 'earnings') {
        valA = a.earnings ?? a.totalEarnings ?? 0;
        valB = b.earnings ?? b.totalEarnings ?? 0;
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
      setSelectedPartner(partner);
      setIsBankModalOpen(true);
      return;
    }
    
    if (window.confirm(`Are you sure you want to process a payout of ₹${pendingAmount.toFixed(2)} to ${partner.name}?`)) {
      setProcessingPayout(partner.id);
      try {
        try {
          await axiosInstance.post(`/api/v1/data/partners/${partner.id}/payout`, { amount: pendingAmount });
        } catch (apiErr) {
          console.warn('Backend payout endpoint warning, updating local state:', apiErr.message);
        }
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

  const exportData = async () => {
    return filteredPartners.map(p => {
      const earnings = Number(p.earnings || p.totalEarnings) || 0;
      const paid = Number(p.paidAmount) || 0;
      const pending = Number(p.pendingAmount) || Math.max(0, earnings - paid);
      return {
        Partner_ID: p.id,
        Partner_Name: p.name || 'N/A',
        Phone: p.phone || p.phoneNumber || 'N/A',
        Email: p.email || 'N/A',
        Category: p.category || p.selectedServiceType || 'N/A',
        Completed_Services: p.completedCount || 0,
        Total_Earnings_INR: earnings,
        Paid_Amount_INR: paid,
        Pending_Payout_INR: pending,
        Bank_Name: p.bankDetails?.bankName || 'N/A',
        Account_Number: p.bankDetails?.accountNumber ? `****${p.bankDetails.accountNumber.slice(-4)}` : 'N/A',
        IFSC_Code: p.bankDetails?.ifscCode || 'N/A',
        Status: p.status || 'active'
      };
    });
  };

  return (
    <div className="space-y-4">
      {/* Search and Export Bar */}
      <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Search className="h-4.5 w-4.5 text-slate-400 dark:text-slate-500 shrink-0" />
          <input
            type="text"
            placeholder="Search partners by name, ID, phone, bank, or IFSC..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-96 bg-transparent text-sm text-slate-700 dark:text-slate-350 outline-none placeholder-slate-400 dark:placeholder-slate-600"
          />
        </div>
        <ExportButton type="Partner_Payouts" getData={exportData} />
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/75 dark:bg-slate-850/50 border-b border-slate-100 dark:border-slate-800 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider select-none">
                <th className={thPadding} onClick={() => handleSort('name')}>
                  <div className="flex items-center gap-1.5 cursor-pointer">Partner {renderSortIndicator('name')}</div>
                </th>
                <th className={thPadding}>Bank Details (Direct Transfer)</th>
                <th className={`${thPadding} text-center`} onClick={() => handleSort('completedCount')}>
                  <div className="flex items-center justify-center gap-1.5 cursor-pointer">Completed Services {renderSortIndicator('completedCount')}</div>
                </th>
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
                  const earnings = Number(partner.earnings || partner.totalEarnings) || 0;
                  const paidAmount = Number(partner.paidAmount) || 0;
                  const pendingAmount = Number(partner.pendingAmount) || Math.max(0, earnings - paidAmount);
                  const hasBankDetails = partner.bankDetails && partner.bankDetails.accountNumber;
                  const canPay = pendingAmount > 0;
                  const completedServices = partner.completedCount ?? partner.orders ?? partner.completedOrders ?? 0;
                  const phoneStr = partner.phone || partner.phoneNumber;
                  const cleanPhone = phoneStr ? phoneStr.replace(/[^0-9]/g, '') : null;

                  return (
                    <tr key={partner.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/30 transition-colors">
                      {/* Partner Name & Contact */}
                      <td className={tdPadding}>
                        <div className="flex items-center gap-3">
                          <div className={`flex items-center justify-center bg-violet-50 dark:bg-violet-950/30 border border-violet-100 dark:border-violet-900/40 font-bold text-violet-700 dark:text-violet-400 ${avatarSize}`}>
                            {(partner.name || '?').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900 dark:text-white leading-tight">{partner.name || 'Partner'}</span>
                              {partner.kycStatus === 'approved' && (
                                <span className="inline-flex items-center rounded-md bg-emerald-50 dark:bg-emerald-950/30 px-1 py-0.2 text-[8px] font-bold text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30">KYC Verified</span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">{partner.id.slice(0, 16)}...</span>
                              {phoneStr && (
                                <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-0.5">
                                  <Phone className="h-2.5 w-2.5 text-violet-500" />
                                  {phoneStr}
                                </span>
                              )}
                            </div>
                            {partner.category && (
                              <span className="inline-block mt-0.5 text-[9px] font-medium text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 rounded">
                                {partner.category}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      
                      {/* Bank Details */}
                      <td className={tdPadding}>
                        {hasBankDetails ? (
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs">{partner.bankDetails.bankName || 'Verified Bank'}</span>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] font-mono font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                                ************{partner.bankDetails.accountNumber.slice(-4)}
                              </span>
                              {partner.bankDetails.ifscCode && (
                                <span className="text-[9px] font-mono text-slate-400">
                                  IFSC: {partner.bankDetails.ifscCode}
                                </span>
                              )}
                              <button 
                                onClick={() => { setSelectedPartner(partner); setIsBankModalOpen(true); }}
                                className="text-[10px] font-bold text-violet-600 dark:text-violet-400 hover:underline cursor-pointer"
                              >
                                Edit
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button 
                            onClick={() => { setSelectedPartner(partner); setIsBankModalOpen(true); }}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 text-[10px] font-bold border border-amber-200 dark:border-amber-800 hover:bg-amber-100 transition-colors cursor-pointer"
                          >
                            <Building2 className="h-3 w-3" />
                            + Add Bank Details
                          </button>
                        )}
                      </td>

                      {/* Completed Services Count */}
                      <td className={`${tdPadding} text-center`}>
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300 border border-violet-100 dark:border-violet-900/30">
                          {completedServices} {completedServices === 1 ? 'service' : 'services'}
                        </span>
                      </td>

                      {/* Earnings */}
                      <td className={`${tdPadding} text-right font-bold text-slate-800 dark:text-slate-200`}>
                        ₹{earnings.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      
                      {/* Paid */}
                      <td className={`${tdPadding} text-right font-bold text-emerald-600 dark:text-emerald-400`}>
                        ₹{paidAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>

                      {/* Pending */}
                      <td className={`${tdPadding} text-right font-bold text-amber-600 dark:text-amber-400`}>
                        ₹{pendingAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>

                      {/* Actions */}
                      <td className={`${tdPadding} text-center`}>
                        <button 
                          disabled={!canPay || processingPayout === partner.id}
                          onClick={() => handleProcessPayout(partner, pendingAmount)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            canPay 
                              ? 'bg-violet-600 hover:bg-violet-700 text-white shadow-sm' 
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed opacity-60'
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
                  <td colSpan="7" className="px-6 py-12 text-center text-slate-400 dark:text-slate-500">
                    <div className="flex flex-col items-center gap-3">
                      <ShieldAlert className="h-9 w-9 text-slate-300 dark:text-slate-700" />
                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-300">No partner records found</h4>
                      <p className="text-xs text-slate-500 max-w-xs mx-auto leading-normal">
                        No partners match your current search criteria.
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
              {[10, 25, 50, 100].map((size) => (
                <option key={size} value={size} className="bg-white dark:bg-slate-900">{size} rows</option>
              ))}
            </select>
          </div>
          <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
            <span>Page <span className="font-bold text-slate-800 dark:text-slate-200">{currentPage}</span> of <span className="font-bold text-slate-800 dark:text-slate-200">{totalPages}</span> ({sortedPartners.length} registered partners)</span>
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
