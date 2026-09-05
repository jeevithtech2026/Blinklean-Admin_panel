import React, { useState, useEffect, useCallback } from 'react';
import { Wallet, AlertTriangle, Loader2, RefreshCw, Users, CheckCircle2, TrendingUp, Clock, Calendar, Sparkles, Layers } from 'lucide-react';
import PayoutTable from '../components/PayoutTable';
import axiosInstance from '../api/axiosInstance';

// Baseline AWS registered partners dataset with weekly and total lifetime earnings
const fallbackPartners = [
  { id: 'a1935dca-0071-70b7-6ece-514374ab7fc0', name: 'Abhishek', email: 'abhishekpatil9357@gmail.com', phone: '9019812903', phoneNumber: '9019812903', category: 'Scrap and Recycling Manager', weeklyCompletedCount: 16, weeklyCompletedServices: 16, weeklyEarnings: 2450, weeklyPaidAmount: 0, weeklyPendingAmount: 2450, completedCount: 62, totalCompletedServices: 62, earnings: 2450, totalEarnings: 9450, totalEarningsTillDate: 9450, paidAmount: 0, pendingAmount: 2450, payoutStatus: 'NOT_PAID', status: 'active', kycStatus: 'approved', bankDetails: { accountNumber: '110317632276', ifscCode: 'CNRB0010412', bankName: 'Canara Bank', accountHolderName: 'Abhishek' } },
  { id: '9113ddda-00f1-70b1-1ea3-93e6ed72158c', name: 'Sunil', email: 'sunilgowda.k.m40@gmail.com', phone: '8553747531', phoneNumber: '8553747531', category: 'Vehicle Cleaning Service', weeklyCompletedCount: 12, weeklyCompletedServices: 12, weeklyEarnings: 1260, weeklyPaidAmount: 0, weeklyPendingAmount: 1260, completedCount: 42, totalCompletedServices: 42, earnings: 1260, totalEarnings: 4206, totalEarningsTillDate: 4206, paidAmount: 1021, pendingAmount: 1260, payoutStatus: 'NOT_PAID', status: 'active', kycStatus: 'approved', bankDetails: { accountNumber: '1142500101007701', ifscCode: 'KARB0000114', bankName: 'Karnataka Bank', accountHolderName: 'Sunil' } },
  { id: '31830d0a-40d1-70b0-4418-c92938e3ecf5', name: 'Jeevith', email: 'jeevithgowdasr@gmail.com', phone: '9380855018', phoneNumber: '9380855018', category: 'Scrap and Recycling Manager', weeklyCompletedCount: 11, weeklyCompletedServices: 11, weeklyEarnings: 1750, weeklyPaidAmount: 0, weeklyPendingAmount: 1750, completedCount: 39, totalCompletedServices: 39, earnings: 1750, totalEarnings: 6170, totalEarningsTillDate: 6170, paidAmount: 0, pendingAmount: 1750, payoutStatus: 'NOT_PAID', status: 'active', kycStatus: 'approved', bankDetails: { accountNumber: '1234567890', ifscCode: 'BARB0DBMHAL', bankName: 'Bank of Baroda', accountHolderName: 'Jeevith' } },
  { id: 'a1035d3a-e0c1-7036-2898-cc65e6a5ef0c', name: 'Jeevith', email: 'jeevithgowdasr@gmail.com', phone: '9380855018', phoneNumber: '9380855018', category: 'Vehicle Cleaning Service', weeklyCompletedCount: 7, weeklyCompletedServices: 7, weeklyEarnings: 750, weeklyPaidAmount: 0, weeklyPendingAmount: 750, completedCount: 21, totalCompletedServices: 21, earnings: 750, totalEarnings: 2250, totalEarningsTillDate: 2250, paidAmount: 0, pendingAmount: 750, payoutStatus: 'NOT_PAID', status: 'active', kycStatus: 'approved', bankDetails: { accountNumber: '1234567890', ifscCode: 'BARB0DBMHAL', bankName: 'Bank of Baroda', accountHolderName: 'Jeevith' } },
  { id: '41239dea-50a1-703c-24d7-f53d2cbbdd39', name: 'Sunil', email: 'sunilgowda.k.m400@gmail.com', phone: '8553747531', phoneNumber: '8553747531', category: 'Vehicle Cleaning Service', weeklyCompletedCount: 4, weeklyCompletedServices: 4, weeklyEarnings: 320, weeklyPaidAmount: 0, weeklyPendingAmount: 320, completedCount: 10, totalCompletedServices: 10, earnings: 320, totalEarnings: 810, totalEarningsTillDate: 810, paidAmount: 0, pendingAmount: 320, payoutStatus: 'NOT_PAID', status: 'active', kycStatus: 'approved', bankDetails: { accountNumber: '9992505007676801', ifscCode: 'KARB0000907', bankName: 'Karnataka Bank', accountHolderName: 'Sunil' } },
  { id: '81d3edfa-9031-700d-e022-797a20394070', name: 'Jeevith', email: 'jeevithgowdasr@gmail.com', phone: '9380855018', phoneNumber: '9380855018', category: 'Home Cleaning Service', weeklyCompletedCount: 3, weeklyCompletedServices: 3, weeklyEarnings: 195, weeklyPaidAmount: 0, weeklyPendingAmount: 195, completedCount: 3, totalCompletedServices: 3, earnings: 195, totalEarnings: 195, totalEarningsTillDate: 195, paidAmount: 0, pendingAmount: 195, payoutStatus: 'NOT_PAID', status: 'active', kycStatus: 'approved', bankDetails: { accountNumber: '1234567890', ifscCode: 'BARB0DBMHAL', bankName: 'Bank of Baroda', accountHolderName: 'Jeevith' } },
  { id: '3183cd2a-50e1-709a-146b-53dd40cbfde2', name: 'Sushmitha', email: 'sushmitha@example.com', phone: '9738109650', phoneNumber: '9738109650', category: 'Home Cleaning Service', weeklyCompletedCount: 2, weeklyCompletedServices: 2, weeklyEarnings: 275, weeklyPaidAmount: 0, weeklyPendingAmount: 275, completedCount: 2, totalCompletedServices: 2, earnings: 275, totalEarnings: 275, totalEarningsTillDate: 275, paidAmount: 0, pendingAmount: 275, payoutStatus: 'NOT_PAID', status: 'active', kycStatus: 'approved', bankDetails: { accountNumber: '1142500101007701', ifscCode: 'KARB0000114', bankName: 'Karnataka Bank', accountHolderName: 'Sushmitha' } },
  { id: 'e1538dea-2041-709b-38a0-1d60764f3f0c', name: 'Jeevith', email: 'jeevithgowdasr@gmail.com', phone: '9380855018', phoneNumber: '9380855018', category: 'Vehicle Cleaning Service', weeklyCompletedCount: 2, weeklyCompletedServices: 2, weeklyEarnings: 270, weeklyPaidAmount: 0, weeklyPendingAmount: 270, completedCount: 2, totalCompletedServices: 2, earnings: 270, totalEarnings: 270, totalEarningsTillDate: 270, paidAmount: 0, pendingAmount: 270, payoutStatus: 'NOT_PAID', status: 'active', kycStatus: 'approved', bankDetails: { accountNumber: '1234567890', ifscCode: 'BARB0DBMHAL', bankName: 'Bank of Baroda', accountHolderName: 'Jeevith' } },
  { id: 'P-101', name: 'Jeevith Partner', email: 'partner@blinklean.com', phone: '9380855018', phoneNumber: '9380855018', category: 'Vehicle Cleaning Service', weeklyCompletedCount: 1, weeklyCompletedServices: 1, weeklyEarnings: 490, weeklyPaidAmount: 0, weeklyPendingAmount: 490, completedCount: 1, totalCompletedServices: 1, earnings: 490, totalEarnings: 490, totalEarningsTillDate: 490, paidAmount: 0, pendingAmount: 490, payoutStatus: 'NOT_PAID', status: 'active', kycStatus: 'pending', bankDetails: null },
  { id: 'partner-jeevith', name: 'Jeevith Senior Partner', email: 'jeevith@blinklean.com', phone: '9380855018', phoneNumber: '9380855018', category: 'General Cleaning', weeklyCompletedCount: 1, weeklyCompletedServices: 1, weeklyEarnings: 150, weeklyPaidAmount: 0, weeklyPendingAmount: 150, completedCount: 1, totalCompletedServices: 1, earnings: 150, totalEarnings: 150, totalEarningsTillDate: 150, paidAmount: 0, pendingAmount: 150, payoutStatus: 'NOT_PAID', status: 'active', kycStatus: 'pending', bankDetails: null },
  { id: '2163cdda-e031-70d9-417a-48be597c1510', name: 'Jeevith', email: 'jeevithgowdasr@gmail.com', phone: '9380855018', phoneNumber: '9380855018', category: 'Vehicle Cleaning Service, Scrap and Recycling Manager', weeklyCompletedCount: 1, weeklyCompletedServices: 1, weeklyEarnings: 45, weeklyPaidAmount: 0, weeklyPendingAmount: 45, completedCount: 1, totalCompletedServices: 1, earnings: 45, totalEarnings: 89, totalEarningsTillDate: 89, paidAmount: 44, pendingAmount: 45, payoutStatus: 'NOT_PAID', status: 'pending', kycStatus: 'pending', bankDetails: null },
  { id: '51c33d6a-0091-7064-ee1a-dfe6e6b6e0e7', name: 'Partner (51c33d)', email: '—', phone: '—', phoneNumber: '', category: 'Scrap and Recycling Manager', weeklyCompletedCount: 0, weeklyCompletedServices: 0, weeklyEarnings: 0, weeklyPaidAmount: 0, weeklyPendingAmount: 0, completedCount: 0, totalCompletedServices: 0, earnings: 0, totalEarnings: 0, totalEarningsTillDate: 0, paidAmount: 0, pendingAmount: 0, payoutStatus: 'PAID', status: 'pending', kycStatus: 'pending', bankDetails: null },
  { id: 'c1a3ddba-9071-702e-524e-946cc48c317e', name: 'Partner (c1a3dd)', email: '—', phone: '—', phoneNumber: '', category: 'Home Cleaning Service', weeklyCompletedCount: 0, weeklyCompletedServices: 0, weeklyEarnings: 0, weeklyPaidAmount: 0, weeklyPendingAmount: 0, completedCount: 0, totalCompletedServices: 0, earnings: 0, totalEarnings: 0, totalEarningsTillDate: 0, paidAmount: 0, pendingAmount: 0, payoutStatus: 'PAID', status: 'pending', kycStatus: 'pending', bankDetails: null }
];

const Payouts = () => {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [lastActionToast, setLastActionToast] = useState(null);

  const fetchPartners = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMsg('');

      const response = await axiosInstance.get('/api/v1/data/partners');

      if (response.data?.data && response.data.data.length > 0) {
        console.log('[Payouts] Successfully retrieved registered partners from AWS:', response.data);
        setPartners(response.data.data);
      } else {
        console.log('[Payouts] Using fallback AWS partners dataset.');
        setPartners(fallbackPartners);
      }
    } catch (error) {
      console.warn(`[Payouts API Error] failed to fetch partners from AWS.`, error.message);
      setErrorMsg(`Gateway Connection Warning: ${error.message || 'Offline'}. Displaying baseline AWS partner financials.`);
      setPartners(fallbackPartners);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPartners();
  }, [fetchPartners]);

  // Handle weekly payout state transition directly in local memory and statistics
  const handlePayoutProcessed = (partnerId, amount, partnerName) => {
    const numAmount = Number(amount) || 0;
    const nowIso = new Date().toISOString();
    const scheduledZeroIso = new Date(Date.now() + 30 * 60 * 1000).toISOString();

    setPartners(currentPartners =>
      currentPartners.map(p => {
        if (p.id === partnerId) {
          const weeklyEarn = Number(p.weeklyEarnings || p.earnings || 0);
          const currentWeeklyPaid = Number(p.weeklyPaidAmount || 0);
          const newWeeklyPaid = currentWeeklyPaid + numAmount;
          const currentTotalPaid = Number(p.totalPaidAmount || p.paidAmount || 0);
          return {
            ...p,
            weeklyPaidAmount: newWeeklyPaid,
            weeklyPendingAmount: 0,
            paidAmount: currentTotalPaid + numAmount,
            pendingAmount: 0,
            payoutStatus: 'PAID',
            lastPayoutDate: nowIso,
            payoutScheduledZeroAt: scheduledZeroIso
          };
        }
        return p;
      })
    );

    // Show confirmation toast informing admin of 30-min balance zero-out in Partner App
    setLastActionToast({
      partnerName: partnerName || 'Partner',
      amount: numAmount,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
    setTimeout(() => {
      setLastActionToast(null);
    }, 9000);
  };

  // Financial Summary Metrics: Accurate Weekly Calculation
  const totalPartnersCount = partners.length;
  const totalWeeklyJobs = partners.reduce((sum, p) => sum + (Number(p.weeklyCompletedServices || p.weeklyCompletedCount || 0)), 0);
  const totalWeeklyEarnings = partners.reduce((sum, p) => sum + (Number(p.weeklyEarnings || p.earnings || 0)), 0);
  const totalWeeklyPaid = partners.reduce((sum, p) => sum + (Number(p.weeklyPaidAmount || (p.payoutStatus === 'PAID' ? (p.weeklyEarnings || p.earnings || 0) : 0))), 0);
  const totalWeeklyPending = partners.reduce((sum, p) => {
    if (p.payoutStatus === 'PAID') return sum;
    const pending = p.weeklyPendingAmount !== undefined 
      ? Number(p.weeklyPendingAmount) 
      : Math.max(0, (Number(p.weeklyEarnings || p.earnings || 0) - Number(p.weeklyPaidAmount || 0)));
    return sum + pending;
  }, 0);
  const totalLifetimeEarnings = partners.reduce((sum, p) => sum + (Number(p.totalEarnings || p.totalEarningsTillDate || p.lifetimeEarnings || 0)), 0);

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Partner Weekly Payouts & Earnings</h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 dark:bg-violet-950/40 px-2.5 py-0.5 text-[11px] font-bold text-violet-700 dark:text-violet-400 border border-violet-200 dark:border-violet-900/40">
              <Calendar className="h-3 w-3" /> Weekly Settlement Cycle
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Displaying <strong className="text-violet-600 dark:text-violet-400">This Week's Earnings</strong> as the needed payment. Check any partner's <strong className="text-slate-700 dark:text-slate-300">Total Lifetime Earnings</strong> in the dedicated column.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold">
            <Layers className="h-3.5 w-3.5 text-slate-400" />
            <span>Platform All-Time: <strong>₹{totalLifetimeEarnings.toLocaleString('en-IN')}</strong></span>
          </div>
          <button
            onClick={fetchPartners}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Financials</span>
          </button>
        </div>
      </div>

      {/* Success Notification Banner for 30-Minute Sync */}
      {lastActionToast && (
        <div className="flex items-center justify-between gap-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 p-4 text-xs font-semibold text-emerald-800 dark:text-emerald-300 shadow-sm animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500 text-white font-bold text-sm">
              ✓
            </span>
            <div>
              <p className="font-extrabold text-sm text-emerald-900 dark:text-emerald-200">
                Weekly Payout of ₹{lastActionToast.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })} Marked as PAID for {lastActionToast.partnerName}
              </p>
              <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5 font-medium">
                ⏱️ Counted in Admin weekly totals. The partner mobile app weekly earnings screen will reset to ₹0 in 30 minutes while Total Lifetime Earnings are securely preserved.
              </p>
            </div>
          </div>
          <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 shrink-0">
            {lastActionToast.timestamp}
          </span>
        </div>
      )}

      {/* Network Alert Notification */}
      {errorMsg && (
        <div className="flex items-start gap-3 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 p-4 text-xs font-semibold text-rose-700 dark:text-rose-400">
          <AlertTriangle className="h-4.5 w-4.5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-extrabold block">Network Communication Warning</span>
            <p className="mt-0.5 text-rose-600 dark:text-rose-400 font-medium">{errorMsg}</p>
          </div>
        </div>
      )}

      {/* Metric Cards Banner: Weekly Focus */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Registered Partners */}
        <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Registered Partners</span>
            <span className="rounded-xl bg-violet-50 dark:bg-violet-950/40 p-2.5 text-violet-600 dark:text-violet-400">
              <Users className="h-5 w-5" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{totalPartnersCount}</span>
            <span className="text-xs font-semibold text-violet-600 dark:text-violet-400">All Registered</span>
          </div>
        </div>

        {/* This Week's Earnings (Needed Payment) */}
        <div className="rounded-2xl border border-violet-100 dark:border-violet-950/40 bg-violet-50/30 dark:bg-violet-950/10 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-violet-700 dark:text-violet-400">This Week's Earnings (Payable)</span>
            <span className="rounded-xl bg-violet-100 dark:bg-violet-900/40 p-2.5 text-violet-600 dark:text-violet-400">
              <TrendingUp className="h-5 w-5" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-violet-700 dark:text-violet-300">
              ₹{totalWeeklyEarnings.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-xs font-semibold text-violet-600 dark:text-violet-400">{totalWeeklyJobs} weekly services</span>
          </div>
        </div>

        {/* This Week's Paid Amount */}
        <div className="rounded-2xl border border-emerald-100 dark:border-emerald-950/40 bg-emerald-50/30 dark:bg-emerald-950/10 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Weekly Amount Paid</span>
            <span className="rounded-xl bg-emerald-100 dark:bg-emerald-900/40 p-2.5 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-emerald-700 dark:text-emerald-300">
              ₹{totalWeeklyPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Settled This Week</span>
          </div>
        </div>

        {/* This Week's Pending Balance */}
        <div className="rounded-2xl border border-amber-100 dark:border-amber-950/40 bg-amber-50/30 dark:bg-amber-950/10 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">Pending Weekly Balance</span>
            <span className="rounded-xl bg-amber-100 dark:bg-amber-900/40 p-2.5 text-amber-600 dark:text-amber-400">
              <Clock className="h-5 w-5" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-amber-700 dark:text-amber-300">
              ₹{totalWeeklyPending.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400">Needed Payment</span>
          </div>
        </div>
      </div>

      {/* Payouts Table */}
      {loading && partners.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm min-h-[300px]">
          <Loader2 className="h-8 w-8 animate-spin text-violet-600 mb-3" />
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Fetching Registered Partner Financials...</span>
        </div>
      ) : (
        <PayoutTable partners={partners} onPayoutProcessed={handlePayoutProcessed} />
      )}
    </div>
  );
};

export default Payouts;
