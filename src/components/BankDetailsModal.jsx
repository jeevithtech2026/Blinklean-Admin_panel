import React, { useState, useEffect } from 'react';
import { X, Building2, UserCircle, Hash, ShieldCheck, Loader2 } from 'lucide-react';
import axiosInstance from '../api/axiosInstance';

const BankDetailsModal = ({ isOpen, onClose, partner, onUpdate }) => {
  const [formData, setFormData] = useState({
    accountHolderName: '',
    bankName: '',
    accountNumber: '',
    ifscCode: ''
  });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (partner && isOpen) {
      setFormData({
        accountHolderName: partner.bankDetails?.accountHolderName || '',
        bankName: partner.bankDetails?.bankName || '',
        accountNumber: partner.bankDetails?.accountNumber || '',
        ifscCode: partner.bankDetails?.ifscCode || ''
      });
      setErrorMsg('');
      setSuccessMsg('');
    }
  }, [partner, isOpen]);

  if (!isOpen || !partner) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      await axiosInstance.put(`/api/v1/data/partners/${partner.id}/bank`, formData);
      setSuccessMsg('Bank details securely saved.');
      if (onUpdate) onUpdate(partner.id, formData);
      
      // Close modal after 1.5 seconds on success
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Failed to update bank details:', err);
      setErrorMsg(err.response?.data?.error || err.message || 'Failed to save bank details');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Bank Details</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Secure payment details for {partner.name}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Alerts */}
        {errorMsg && (
          <div className="mx-5 mt-5 p-3 rounded-lg bg-rose-50 text-rose-700 text-sm font-semibold border border-rose-100">
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="mx-5 mt-5 p-3 rounded-lg bg-emerald-50 text-emerald-700 text-sm font-semibold border border-emerald-100 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            {successMsg}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Account Holder Name</label>
            <div className="relative">
              <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input 
                type="text"
                name="accountHolderName"
                value={formData.accountHolderName}
                onChange={handleChange}
                placeholder="e.g. John Doe"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Bank Name</label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input 
                type="text"
                name="bankName"
                value={formData.bankName}
                onChange={handleChange}
                placeholder="e.g. HDFC Bank"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Account Number</label>
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input 
                type="text"
                name="accountNumber"
                value={formData.accountNumber}
                onChange={handleChange}
                required
                placeholder="e.g. 5010023456789"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all font-mono"
              />
            </div>
            <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
              <ShieldCheck className="h-3 w-3" /> Account numbers are securely encrypted at rest.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">IFSC Code</label>
            <div className="relative">
              <input 
                type="text"
                name="ifscCode"
                value={formData.ifscCode}
                onChange={handleChange}
                required
                placeholder="e.g. HDFC0001234"
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all uppercase font-mono"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl font-bold text-sm text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl font-bold text-sm text-white bg-violet-600 hover:bg-violet-700 transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Saving...
                </>
              ) : (
                'Save Securely'
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default BankDetailsModal;
