import React, { useState, useEffect } from 'react';
import { Wallet, AlertTriangle, Loader2 } from 'lucide-react';
import PayoutTable from '../components/PayoutTable';
import axiosInstance from '../api/axiosInstance';

const Payouts = () => {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchPartners = async () => {
    try {
      setLoading(true);
      setErrorMsg('');

      const response = await axiosInstance.get('/api/v1/data/partners');

      if (response.data?.data) {
        setPartners(response.data.data);
      }
    } catch (error) {
      console.warn(`[Payouts API Error] failed to fetch partners.`, error.message);
      setErrorMsg(`Gateway Connection Failure: ${error.message || 'Offline'}. Cannot process payouts.`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPartners();
  }, []);

  const handlePayoutProcessed = (partnerId, amount) => {
    setPartners(currentPartners => 
      currentPartners.map(p => {
        if (p.id === partnerId) {
          return {
            ...p,
            paidAmount: (Number(p.paidAmount) || 0) + amount
          };
        }
        return p;
      })
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Partner Payouts</h1>
          <p className="text-sm text-slate-500">Manage partner earnings, bank details, and process weekly transfers.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={fetchPartners}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
          >
            Refresh Data
          </button>
        </div>
      </div>

      {/* Network Alert Notification */}
      {errorMsg && (
        <div className="flex items-start gap-3 rounded-xl bg-rose-50 border border-rose-100 p-4 text-xs font-semibold text-rose-700">
          <AlertTriangle className="h-4.5 w-4.5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-extrabold block">Network Communication Warning</span>
            <p className="mt-0.5 text-rose-600 font-medium">{errorMsg}</p>
          </div>
        </div>
      )}

      {/* Payouts Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-slate-100 shadow-sm min-h-[300px]">
          <Loader2 className="h-8 w-8 animate-spin text-violet-600 mb-3" />
          <span className="text-xs font-semibold text-slate-500">Fetching Partner Financials...</span>
        </div>
      ) : (
        <PayoutTable partners={partners} onPayoutProcessed={handlePayoutProcessed} />
      )}
    </div>
  );
};

export default Payouts;
