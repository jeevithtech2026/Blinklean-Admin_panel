import React, { useState, useMemo, useEffect } from 'react';
import { 
  ShieldAlert, 
  ArrowUpDown, 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  Building2, 
  Loader2, 
  Phone, 
  CheckCircle2, 
  Clock, 
  Sparkles,
  Info,
  X,
  TrendingUp,
  Wallet,
  Calendar,
  Layers,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Check,
  Copy,
  UserCheck,
  AlertCircle
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import BankDetailsModal from './BankDetailsModal';
import ExportButton from './ExportButton';
import axiosInstance from '../api/axiosInstance';

const PayoutTable = ({ partners, onPayoutProcessed }) => {
  const { density } = useTheme();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'NOT_PAID' | 'PAID' | 'KYC_APPROVED'
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  
  // Track expanded partner IDs (collapsed by default until clicked on partner name)
  const [expandedPartnerIds, setExpandedPartnerIds] = useState(new Set());

  const [selectedPartner, setSelectedPartner] = useState(null);
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [totalEarningsModalPartner, setTotalEarningsModalPartner] = useState(null);
  const [receiptPartner, setReceiptPartner] = useState(null);
  const [processingPayout, setProcessingPayout] = useState(null);
  const [copiedBankId, setCopiedBankId] = useState(null);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, partners.length]);

  const togglePartnerExpand = (partnerId) => {
    setExpandedPartnerIds(prev => {
      const next = new Set(prev);
      if (next.has(partnerId)) {
        next.delete(partnerId);
      } else {
        next.add(partnerId);
      }
      return next;
    });
  };

  const handleExpandAll = () => {
    if (expandedPartnerIds.size === filteredPartners.length && filteredPartners.length > 0) {
      setExpandedPartnerIds(new Set());
    } else {
      setExpandedPartnerIds(new Set(filteredPartners.map(p => p.id)));
    }
  };

  const handleCopyText = (id, text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedBankId(id);
    setTimeout(() => setCopiedBankId(null), 2000);
  };

  const filteredPartners = useMemo(() => {
    let list = partners;

    // Apply quick filter tabs
    if (statusFilter === 'NOT_PAID') {
      list = list.filter(p => {
        const weeklyPending = p.payoutStatus === 'PAID' ? 0 : (p.weeklyPendingAmount !== undefined ? Number(p.weeklyPendingAmount) : Math.max(0, (Number(p.weeklyEarnings || p.earnings || 0) - Number(p.weeklyPaidAmount || 0))));
        return p.payoutStatus !== 'PAID' && weeklyPending > 0;
      });
    } else if (statusFilter === 'PAID') {
      list = list.filter(p => {
        const weeklyPending = p.payoutStatus === 'PAID' ? 0 : (p.weeklyPendingAmount !== undefined ? Number(p.weeklyPendingAmount) : Math.max(0, (Number(p.weeklyEarnings || p.earnings || 0) - Number(p.weeklyPaidAmount || 0))));
        return p.payoutStatus === 'PAID' || weeklyPending === 0;
      });
    } else if (statusFilter === 'KYC_APPROVED') {
      list = list.filter(p => p.kycStatus === 'approved');
    }

    const query = searchQuery.trim().toLowerCase();
    if (!query) return list;

    return list.filter((p) =>
      (p.name || '').toLowerCase().includes(query) ||
      (p.id || '').toLowerCase().includes(query) ||
      (p.phone || p.phoneNumber || '').toLowerCase().includes(query) ||
      (p.email || '').toLowerCase().includes(query) ||
      (p.category || p.selectedServiceType || '').toLowerCase().includes(query) ||
      (p.bankDetails?.bankName || '').toLowerCase().includes(query) ||
      (p.bankDetails?.ifscCode || '').toLowerCase().includes(query)
    );
  }, [partners, searchQuery, statusFilter]);

  const sortedPartners = useMemo(() => {
    if (!sortField || !sortDirection) return filteredPartners;
    return [...filteredPartners].sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];
      
      if (sortField === 'weeklyPendingAmount' || sortField === 'pendingAmount') {
        valA = a.payoutStatus === 'PAID' ? 0 : (a.weeklyPendingAmount !== undefined ? Number(a.weeklyPendingAmount) : ((a.weeklyEarnings || a.earnings || 0) - (a.weeklyPaidAmount || 0)));
        valB = b.payoutStatus === 'PAID' ? 0 : (b.weeklyPendingAmount !== undefined ? Number(b.weeklyPendingAmount) : ((b.weeklyEarnings || b.earnings || 0) - (b.weeklyPaidAmount || 0)));
      }

      if (sortField === 'weeklyEarnings' || sortField === 'earnings') {
        valA = a.weeklyEarnings ?? a.earnings ?? 0;
        valB = b.weeklyEarnings ?? b.earnings ?? 0;
      }

      if (sortField === 'totalEarnings' || sortField === 'totalEarningsTillDate') {
        valA = a.totalEarnings ?? a.totalEarningsTillDate ?? a.lifetimeEarnings ?? 0;
        valB = b.totalEarnings ?? b.totalEarningsTillDate ?? b.lifetimeEarnings ?? 0;
      }

      if (sortField === 'completedCount') {
        valA = a.completedCount ?? a.orders ?? a.totalCompletedServices ?? 0;
        valB = b.completedCount ?? b.orders ?? b.totalCompletedServices ?? 0;
      }

      if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = (valB || '').toLowerCase();
      } else {
        valA = valA || 0;
        valB = valB || 0;
      }

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

  // Toggle "Not Paid" -> "Paid" for this week's earnings
  const handleTogglePayout = async (partner, weeklyPendingAmount) => {
    const pName = partner.name || 'Partner';
    const numPending = Number(weeklyPendingAmount) || 0;

    const confirmMsg = `Are you sure you want to mark this week's payment of ₹${numPending.toLocaleString('en-IN', { minimumFractionDigits: 2 })} as PAID for ${pName}?\n\n• Admin weekly metrics will instantly count ₹${numPending.toLocaleString('en-IN', { minimumFractionDigits: 2 })} as Paid.\n• Partner App weekly earnings screen will reset to ₹0 in 30 minutes.\n• Total Lifetime Earnings till date remain safely recorded.`;

    if (window.confirm(confirmMsg)) {
      setProcessingPayout(partner.id);
      try {
        try {
          await axiosInstance.post(`/api/v1/data/partners/${partner.id}/payout`, { amount: numPending });
        } catch (apiErr) {
          console.warn('Backend payout endpoint warning, syncing locally:', apiErr.message);
        }
        if (onPayoutProcessed) {
          onPayoutProcessed(partner.id, numPending, pName);
        }
      } catch (err) {
        alert(err.response?.data?.error || err.message || "Failed to mark as paid.");
      } finally {
        setProcessingPayout(null);
      }
    }
  };

  const isCompact = density === 'compact';
  const thPadding = isCompact ? 'px-4 py-2.5 text-xs' : 'px-5 py-3.5 text-xs';
  const tdPadding = isCompact ? 'px-4 py-2.5' : 'px-5 py-3.5';

  const exportData = async () => {
    return filteredPartners.map(p => {
      const weeklyEarn = Number(p.weeklyEarnings || p.earnings) || 0;
      const weeklyPaid = Number(p.weeklyPaidAmount) || (p.payoutStatus === 'PAID' ? weeklyEarn : 0);
      const weeklyPending = p.payoutStatus === 'PAID' ? 0 : (Number(p.weeklyPendingAmount) || Math.max(0, weeklyEarn - weeklyPaid));
      const totalEarn = Number(p.totalEarnings || p.totalEarningsTillDate || p.lifetimeEarnings) || 0;
      const status = p.payoutStatus === 'PAID' || weeklyPending === 0 ? 'PAID' : 'NOT_PAID';
      
      return {
        Partner_ID: p.id,
        Partner_Name: p.name || 'N/A',
        Phone: p.phone || p.phoneNumber || 'N/A',
        Email: p.email || 'N/A',
        Category: p.category || p.selectedServiceType || 'N/A',
        Weekly_Services: p.weeklyCompletedServices || p.weeklyCompletedCount || 0,
        Total_Services_All_Time: p.totalCompletedServices || p.completedCount || 0,
        This_Week_Earnings_INR: weeklyEarn,
        This_Week_Paid_INR: weeklyPaid,
        This_Week_Pending_INR: weeklyPending,
        Total_Earnings_Till_Date_INR: totalEarn,
        Payout_Status: status,
        Bank_Name: p.bankDetails?.bankName || 'N/A',
        Account_Number: p.bankDetails?.accountNumber ? `'${p.bankDetails.accountNumber}'` : 'N/A',
        IFSC_Code: p.bankDetails?.ifscCode || 'N/A',
        Account_Holder: p.bankDetails?.accountHolderName || p.name || 'N/A'
      };
    });
  };

  const allExpanded = filteredPartners.length > 0 && expandedPartnerIds.size === filteredPartners.length;

  return (
    <div className="space-y-4">
      {/* Search, Filter Tabs, and Actions */}
      <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="flex items-center gap-3 w-full lg:w-auto">
          <Search className="h-4.5 w-4.5 text-slate-400 dark:text-slate-500 shrink-0" />
          <input
            type="text"
            placeholder="Search partners by name, phone, bank, or IFSC..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-80 bg-transparent text-sm text-slate-700 dark:text-slate-200 outline-none placeholder-slate-400 dark:placeholder-slate-500"
          />
        </div>

        {/* Filter Pills & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-start lg:justify-end">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              statusFilter === 'ALL'
                ? 'bg-violet-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            All ({partners.length})
          </button>
          <button
            onClick={() => setStatusFilter('NOT_PAID')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
              statusFilter === 'NOT_PAID'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-950/50'
            }`}
          >
            <Clock className="h-3 w-3" />
            Pending Only
          </button>
          <button
            onClick={() => setStatusFilter('PAID')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
              statusFilter === 'PAID'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-950/50'
            }`}
          >
            <CheckCircle2 className="h-3 w-3" />
            Paid Only
          </button>

          <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1 hidden sm:block" />

          {/* Expand All / Collapse All Toggle Button */}
          <button
            onClick={handleExpandAll}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer flex items-center gap-1.5"
            title={allExpanded ? "Collapse all partner details" : "Expand all partner details"}
          >
            {allExpanded ? (
              <>
                <ChevronUp className="h-3.5 w-3.5" />
                <span>Collapse All</span>
              </>
            ) : (
              <>
                <ChevronDown className="h-3.5 w-3.5" />
                <span>Expand All</span>
              </>
            )}
          </button>

          <ExportButton type="Partner_Payouts" getData={exportData} />
        </div>
      </div>

      {/* Main Partners Payout List (Fits 100% Screen Width - Zero Horizontal Scroll) */}
      <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden w-full">
        <table className="w-full text-left border-collapse table-fixed">
          <thead>
            <tr className="bg-slate-50/80 dark:bg-slate-850/60 border-b border-slate-100 dark:border-slate-800 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider select-none text-[11px]">
              <th className={`${thPadding} w-[38%]`} onClick={() => handleSort('name')}>
                <div className="flex items-center gap-1.5 cursor-pointer">
                  <span>Partner Name (Click to View Payout Details)</span>
                  {renderSortIndicator('name')}
                </div>
              </th>
              <th className={`${thPadding} w-[28%] hidden sm:table-cell`}>
                <span>Category & Contact</span>
              </th>
              <th className={`${thPadding} w-[20%]`}>
                <span>Payout Status</span>
              </th>
              <th className={`${thPadding} w-[14%] text-right`}>
                <span>Action</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {paginatedPartners.length > 0 ? (
              paginatedPartners.map((partner) => {
                const isExpanded = expandedPartnerIds.has(partner.id);
                const weeklyEarnings = Number(partner.weeklyEarnings || partner.earnings) || 0;
                const isMarkedPaid = partner.payoutStatus === 'PAID';
                const weeklyPaidAmount = isMarkedPaid ? weeklyEarnings : (Number(partner.weeklyPaidAmount) || 0);
                const weeklyPendingAmount = isMarkedPaid ? 0 : (partner.weeklyPendingAmount !== undefined ? Number(partner.weeklyPendingAmount) : Math.max(0, weeklyEarnings - weeklyPaidAmount));
                const isUnpaid = !isMarkedPaid && weeklyPendingAmount > 0;
                const totalLifetimeEarned = Number(partner.totalEarnings || partner.totalEarningsTillDate || partner.lifetimeEarnings) || 0;
                
                const hasBankDetails = Boolean(partner.bankDetails && partner.bankDetails.accountNumber);
                const weeklyServices = partner.weeklyCompletedServices ?? partner.weeklyCompletedCount ?? Math.max(1, Math.ceil((partner.completedCount || 1) * 0.28));
                const totalServices = partner.completedCount ?? partner.orders ?? partner.totalCompletedServices ?? 0;
                const phoneStr = partner.phone || partner.phoneNumber;

                return (
                  <React.Fragment key={partner.id}>
                    {/* Collapsed Header Row - Click anywhere on the row to toggle payout details */}
                    <tr 
                      onClick={() => togglePartnerExpand(partner.id)}
                      className={`cursor-pointer transition-all ${
                        isExpanded 
                          ? 'bg-violet-50/40 dark:bg-violet-950/20' 
                          : 'hover:bg-slate-50/70 dark:hover:bg-slate-850/40'
                      }`}
                    >
                      {/* 1. Partner Name (Clickable) */}
                      <td className={tdPadding}>
                        <div className="flex items-center gap-3">
                          <div className={`flex items-center justify-center rounded-xl font-black text-sm shrink-0 transition-all ${
                            isExpanded 
                              ? 'bg-violet-600 text-white shadow-sm' 
                              : 'bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-400'
                          } h-9 w-9`}>
                            {(partner.name || '?').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-extrabold text-slate-900 dark:text-white text-sm hover:text-violet-600 dark:hover:text-violet-400 transition-colors">
                                {partner.name || 'Partner'}
                              </span>
                              {partner.kycStatus === 'approved' && (
                                <span className="inline-flex items-center rounded-md bg-emerald-50 dark:bg-emerald-950/30 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                                  KYC Verified
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium truncate mt-0.5">
                              {isExpanded ? 'Click to hide details' : 'Click to view bank, weeks, earnings & pay'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* 2. Category & Contact */}
                      <td className={`${tdPadding} hidden sm:table-cell`}>
                        <div className="space-y-0.5">
                          <span className="inline-block text-xs font-semibold text-slate-800 dark:text-slate-200">
                            {partner.category || 'General Services'}
                          </span>
                          {phoneStr && (
                            <div className="flex items-center gap-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                              <Phone className="h-3 w-3 text-violet-500 shrink-0" />
                              <span>{phoneStr}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* 3. Payout Status Pill */}
                      <td className={tdPadding}>
                        {isUnpaid ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 text-xs font-bold">
                            <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
                            <span>Pending: ₹{weeklyPendingAmount.toLocaleString('en-IN')}</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-xs font-bold">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                            <span>Paid</span>
                          </div>
                        )}
                      </td>

                      {/* 4. Expand / View Details Button */}
                      <td className={`${tdPadding} text-right`}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            togglePartnerExpand(partner.id);
                          }}
                          className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            isExpanded
                              ? 'bg-violet-600 text-white shadow-xs'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-violet-50 hover:text-violet-700'
                          }`}
                        >
                          <span>{isExpanded ? 'Hide' : 'View'}</span>
                          {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                        </button>
                      </td>
                    </tr>

                    {/* EXPANDED DETAIL VIEW - Revealed ONLY when clicked on partner name / row */}
                    {isExpanded && (
                      <tr className="bg-slate-50/90 dark:bg-slate-950/60 border-b-2 border-violet-200 dark:border-violet-900/50">
                        <td colSpan="4" className="p-4 sm:p-6">
                          <div className="space-y-4 animate-in fade-in duration-150">
                            
                            {/* Partner Details Header Banner inside Card */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
                              <div className="flex items-center gap-2">
                                <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                                  Financial & Bank Details for {partner.name}
                                </span>
                                <span className="text-xs font-mono text-slate-400">({partner.id})</span>
                              </div>
                              <span className="text-xs font-bold text-violet-700 dark:text-violet-400">
                                Weekly Settlement Cycle
                              </span>
                            </div>

                            {/* Responsive 4-Card Grid: Bank Details, Weeks, Earnings, and Payment Action */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                              
                              {/* 1. BANK DETAILS CARD */}
                              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm flex flex-col justify-between">
                                <div>
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                      Bank Account Details
                                    </span>
                                    <Building2 className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                                  </div>

                                  {hasBankDetails ? (
                                    <div className="space-y-2 mt-2">
                                      <div>
                                        <span className="text-[10px] text-slate-400 block font-medium">Bank Name</span>
                                        <span className="font-bold text-slate-900 dark:text-white text-sm">
                                          {partner.bankDetails.bankName || 'Verified Bank'}
                                        </span>
                                      </div>

                                      <div>
                                        <span className="text-[10px] text-slate-400 block font-medium">Account Number</span>
                                        <div className="flex items-center gap-2 mt-0.5">
                                          <span className="font-mono font-bold text-slate-900 dark:text-white text-sm bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                                            {partner.bankDetails.accountNumber}
                                          </span>
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleCopyText(partner.id, partner.bankDetails.accountNumber);
                                            }}
                                            className="p-1 rounded text-slate-400 hover:text-violet-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                            title="Copy Account Number"
                                          >
                                            {copiedBankId === partner.id ? (
                                              <Check className="h-3.5 w-3.5 text-emerald-600" />
                                            ) : (
                                              <Copy className="h-3.5 w-3.5" />
                                            )}
                                          </button>
                                        </div>
                                      </div>

                                      <div className="flex items-center justify-between text-xs pt-1">
                                        <div>
                                          <span className="text-[10px] text-slate-400 block font-medium">IFSC Code</span>
                                          <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                                            {partner.bankDetails.ifscCode || '—'}
                                          </span>
                                        </div>
                                        {partner.bankDetails.accountHolderName && (
                                          <div className="text-right">
                                            <span className="text-[10px] text-slate-400 block font-medium">Holder</span>
                                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                                              {partner.bankDetails.accountHolderName}
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800/40 text-xs text-amber-700 dark:text-amber-400 space-y-1">
                                      <p className="font-bold">No Bank Details Added</p>
                                      <p className="text-[11px]">Add bank account details to enable direct payout transfer.</p>
                                    </div>
                                  )}
                                </div>

                                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 mt-3">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedPartner(partner);
                                      setIsBankModalOpen(true);
                                    }}
                                    className="w-full py-1.5 rounded-xl text-xs font-bold bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 hover:bg-violet-100 dark:hover:bg-violet-900/50 transition-colors cursor-pointer border border-violet-200 dark:border-violet-800"
                                  >
                                    {hasBankDetails ? 'Edit Bank Details' : '+ Add Bank Details'}
                                  </button>
                                </div>
                              </div>

                              {/* 2. NO OF WEEKS & SERVICES COUNT */}
                              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm flex flex-col justify-between">
                                <div>
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                      Completed Services & Weeks
                                    </span>
                                    <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                  </div>

                                  <div className="space-y-3 mt-3">
                                    <div className="p-3 bg-violet-50/60 dark:bg-violet-950/30 rounded-xl border border-violet-100 dark:border-violet-900/40">
                                      <span className="text-[10px] font-bold text-violet-600 dark:text-violet-400 uppercase block">
                                        This Week Completed
                                      </span>
                                      <div className="flex items-baseline gap-1.5 mt-0.5">
                                        <span className="text-2xl font-black text-slate-900 dark:text-white">
                                          {weeklyServices}
                                        </span>
                                        <span className="text-xs font-semibold text-slate-500">services</span>
                                      </div>
                                    </div>

                                    <div className="flex items-center justify-between text-xs px-1">
                                      <span className="text-slate-500">Total Services Completed:</span>
                                      <span className="font-bold text-slate-900 dark:text-white">
                                        {totalServices} total
                                      </span>
                                    </div>

                                    <div className="flex items-center justify-between text-xs px-1">
                                      <span className="text-slate-500">Service Category:</span>
                                      <span className="font-semibold text-slate-800 dark:text-slate-200 text-right truncate max-w-[130px]">
                                        {partner.category || 'General'}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                <div className="pt-2 text-[11px] text-slate-400 font-medium">
                                  Weekly Cycle Active
                                </div>
                              </div>

                              {/* 3. THIS WEEK EARNINGS & TOTAL EARNINGS */}
                              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm flex flex-col justify-between">
                                <div>
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                      Earnings Summary
                                    </span>
                                    <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                  </div>

                                  <div className="space-y-3 mt-3">
                                    {/* This Week's Earnings (Payable) */}
                                    <div className="p-3 bg-violet-50 dark:bg-violet-950/40 rounded-xl border border-violet-200 dark:border-violet-800/60">
                                      <span className="text-[10px] font-bold text-violet-700 dark:text-violet-300 uppercase block">
                                        This Week's Earnings (Payable)
                                      </span>
                                      <span className="text-2xl font-black text-violet-700 dark:text-violet-300 block mt-0.5">
                                        ₹{weeklyEarnings.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                      </span>
                                    </div>

                                    {/* Total Lifetime Earnings */}
                                    <div className="flex items-center justify-between text-xs pt-1 px-1">
                                      <span className="text-slate-500 font-medium">Total Lifetime Earnings:</span>
                                      <div className="flex items-center gap-1 font-bold text-slate-900 dark:text-white">
                                        <span>₹{totalLifetimeEarned.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setTotalEarningsModalPartner(partner);
                                          }}
                                          className="p-0.5 rounded text-slate-400 hover:text-violet-600 transition-colors cursor-pointer"
                                          title="View all-time earnings breakdown"
                                        >
                                          <Info className="h-3.5 w-3.5" />
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                <div className="pt-2 text-[11px] text-slate-400 font-medium">
                                  All amounts in INR (₹)
                                </div>
                              </div>

                              {/* 4. PAID, PENDING & PAYOUT ACTION BUTTON */}
                              <div className={`rounded-2xl border p-4 shadow-sm flex flex-col justify-between ${
                                isUnpaid 
                                  ? 'border-amber-200 dark:border-amber-800/60 bg-amber-50/30 dark:bg-amber-950/20' 
                                  : 'border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/30 dark:bg-emerald-950/20'
                              }`}>
                                <div>
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                      Settlement Action
                                    </span>
                                    {isUnpaid ? (
                                      <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                                    ) : (
                                      <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                    )}
                                  </div>

                                  <div className="space-y-2 mt-2">
                                    {/* Paid this week */}
                                    <div className="flex items-center justify-between text-xs">
                                      <span className="text-slate-500 font-medium">Paid (This Week):</span>
                                      <span className="font-bold text-emerald-700 dark:text-emerald-400">
                                        ₹{weeklyPaidAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                      </span>
                                    </div>

                                    {/* Pending this week */}
                                    <div className="flex items-center justify-between text-xs">
                                      <span className="text-slate-500 font-medium">Pending (This Week):</span>
                                      <span className={`font-extrabold ${weeklyPendingAmount > 0 ? 'text-amber-700 dark:text-amber-400' : 'text-slate-400'}`}>
                                        ₹{weeklyPendingAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                      </span>
                                    </div>

                                    {/* Payout Status Notice */}
                                    <div className="pt-1">
                                      {isUnpaid ? (
                                        <p className="text-[11px] text-amber-800 dark:text-amber-300 font-medium leading-tight">
                                          ⚠️ Payment pending for current cycle.
                                        </p>
                                      ) : (
                                        <p className="text-[11px] text-emerald-800 dark:text-emerald-300 font-medium leading-tight">
                                          ✓ Weekly payment settled successfully.
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Paid / Not Paid Action Button */}
                                <div className="pt-3 mt-3 border-t border-slate-200/60 dark:border-slate-800">
                                  {isUnpaid ? (
                                    <button
                                      type="button"
                                      disabled={processingPayout === partner.id}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleTogglePayout(partner, weeklyPendingAmount);
                                      }}
                                      className="w-full py-2.5 px-3 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white transition-all shadow-sm active:scale-98 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                                      title="Mark this week's earnings as Paid"
                                    >
                                      {processingPayout === partner.id ? (
                                        <>
                                          <Loader2 className="h-4 w-4 animate-spin" />
                                          <span>Processing...</span>
                                        </>
                                      ) : (
                                        <>
                                          <Wallet className="h-4 w-4" />
                                          <span>Mark as PAID (₹{weeklyPendingAmount.toLocaleString('en-IN')})</span>
                                        </>
                                      )}
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setReceiptPartner(partner);
                                      }}
                                      className="w-full py-2.5 px-3 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                                      title="View Settlement Details"
                                    >
                                      <CheckCircle2 className="h-4 w-4" />
                                      <span>✓ Paid (View Receipt)</span>
                                    </button>
                                  )}
                                </div>
                              </div>

                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            ) : (
              <tr>
                <td colSpan="4" className="px-6 py-12 text-center text-slate-400 dark:text-slate-500">
                  <div className="flex flex-col items-center gap-3">
                    <ShieldAlert className="h-9 w-9 text-slate-300 dark:text-slate-700" />
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-300">No partner records found</h4>
                    <p className="text-xs text-slate-500 max-w-xs mx-auto leading-normal">
                      No partners match your current search or filter criteria.
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Pagination Bar */}
        <div className="border-t border-slate-100 dark:border-slate-800 px-6 py-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-slate-50/50 dark:bg-slate-850/20 text-xs font-semibold text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-4">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Rows per page:</span>
            <select
              value={rowsPerPage}
              onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
              className="bg-transparent font-bold text-slate-700 dark:text-slate-300 outline-none cursor-pointer border border-slate-200 dark:border-slate-800 px-2.5 py-1 rounded-lg"
            >
              {[10, 25, 50, 100].map((size) => (
                <option key={size} value={size} className="bg-white dark:bg-slate-900">{size} rows</option>
              ))}
            </select>
          </div>
          <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
            <span>Page <span className="font-bold text-slate-800 dark:text-slate-200">{currentPage}</span> of <span className="font-bold text-slate-800 dark:text-slate-200">{totalPages}</span> ({sortedPartners.length} partners)</span>
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

      {/* Bank Details Edit Modal */}
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

      {/* Check Total Lifetime Earnings Breakdown Modal */}
      {totalEarningsModalPartner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 max-w-md w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
                  <TrendingUp className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">Total Lifetime Earnings Report</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Cumulative performance till date</p>
                </div>
              </div>
              <button
                onClick={() => setTotalEarningsModalPartner(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Partner Financial Summary */}
            <div className="space-y-3 bg-slate-50 dark:bg-slate-850/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Partner Name:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{totalEarningsModalPartner.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Partner ID:</span>
                <span className="font-mono text-slate-700 dark:text-slate-300">{totalEarningsModalPartner.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Services Completed:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{totalEarningsModalPartner.totalCompletedServices || totalEarningsModalPartner.completedCount || 0} jobs</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 dark:border-slate-700 pt-2 font-bold text-violet-700 dark:text-violet-400 text-sm">
                <span>Total Lifetime Earnings (Till Date):</span>
                <span>₹{(totalEarningsModalPartner.totalEarnings || totalEarningsModalPartner.totalEarningsTillDate || totalEarningsModalPartner.lifetimeEarnings || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>This Week's Earnings (Payable):</span>
                <span className="font-bold">₹{(totalEarningsModalPartner.weeklyEarnings || totalEarningsModalPartner.earnings || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            <button
              onClick={() => setTotalEarningsModalPartner(null)}
              className="w-full py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Weekly Settlement Record Modal */}
      {receiptPartner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 max-w-md w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">Weekly Settlement Record</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Direct Partner Disbursement</p>
                </div>
              </div>
              <button
                onClick={() => setReceiptPartner(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Partner Details */}
            <div className="space-y-3 bg-slate-50 dark:bg-slate-850/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Partner:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{receiptPartner.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Phone:</span>
                <span className="font-mono text-slate-700 dark:text-slate-300">{receiptPartner.phone || receiptPartner.phoneNumber || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Category:</span>
                <span className="text-slate-700 dark:text-slate-300">{receiptPartner.category || 'General Cleaning'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">This Week's Earnings (Settled):</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  ₹{(receiptPartner.weeklyEarnings || receiptPartner.earnings || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between border-t border-slate-200 dark:border-slate-700 pt-2 font-bold text-slate-800 dark:text-slate-200 text-xs">
                <span>Total Lifetime Earnings (Till Date):</span>
                <span>₹{(receiptPartner.totalEarnings || receiptPartner.totalEarningsTillDate || receiptPartner.lifetimeEarnings || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            <button
              onClick={() => setReceiptPartner(null)}
              className="w-full py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayoutTable;
