import React, { useState, useEffect } from 'react';
import { Ticket } from 'lucide-react';
import axiosInstance from '../api/axiosInstance';

const DiscountCouponsPanel = ({ loading: parentLoading }) => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchCoupons = async () => {
      try {
        const response = await axiosInstance.get('/api/v1/data/coupons');
        if (isMounted && response.data?.data) {
          const active = response.data.data.filter(c => c.isActive);
          setCoupons(active.slice(0, 5));
        }
      } catch (err) {
        console.warn('[DiscountCouponsPanel] Failed to fetch coupons:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchCoupons();
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
    <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm flex flex-col h-full min-h-[350px] justify-between">
      <div className="border-b border-slate-50 dark:border-slate-850 pb-4 mb-4">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Active Discounts & Promos</h2>
        <p className="text-xs text-slate-400 dark:text-slate-550">Current customer promo codes & campaigns</p>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto max-h-[220px] scrollbar-thin">
        {coupons.length > 0 ? (
          coupons.map((coupon, i) => (
            <div key={coupon.couponId || i} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 hover:bg-white dark:hover:bg-slate-900 transition-all duration-300">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50 dark:bg-orange-950/30 border border-orange-100 dark:border-orange-900/40 text-orange-600 dark:text-orange-400">
                  <Ticket className="h-4 w-4" />
                </div>
                <div>
                  <span className="font-mono font-bold text-slate-900 dark:text-white text-xs">{coupon.couponId}</span>
                  <div className="text-[10px] text-slate-450 mt-0.5">
                    {coupon.validUntil ? `Valid until ${coupon.validUntil}` : 'No expiry'}
                  </div>
                </div>
              </div>
              <div className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                {coupon.discountPercentage}% OFF
              </div>
            </div>
          ))
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950/20">
            <Ticket className="h-8 w-8 text-slate-350 dark:text-slate-650 mb-2 animate-bounce" />
            <span className="text-xs font-bold text-slate-600 dark:text-slate-450">No active coupons found</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default DiscountCouponsPanel;
