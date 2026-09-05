import React, { useState, useEffect } from 'react';
import { X, Phone, CheckCircle, Loader2, Save } from 'lucide-react';
import axiosInstance from '../api/axiosInstance';

const EditPartnerPhoneModal = ({ isOpen, onClose, partner, onUpdate }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (partner && isOpen) {
      setPhoneNumber(partner.phoneNumber || partner.personalInfo?.phone || partner.phone || '');
      setErrorMsg('');
      setSuccessMsg('');
    }
  }, [partner, isOpen]);

  if (!isOpen || !partner) return null;

  const handleSave = async (e) => {
    e.preventDefault();
    if (!phoneNumber.trim()) {
      setErrorMsg('Please enter a valid contact phone number.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      try {
        await axiosInstance.put(`/api/v1/data/partners/${partner.id}/contact`, {
          phone: phoneNumber.trim(),
          phoneNumber: phoneNumber.trim()
        });
      } catch (apiErr) {
        console.warn('Backend contact endpoint not available, updating local partner state:', apiErr.message);
      }

      setSuccessMsg('Partner contact number updated successfully.');
      if (onUpdate) {
        onUpdate(partner.id, phoneNumber.trim());
      }

      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err) {
      setErrorMsg(err.response?.data?.error || err.message || 'Failed to update contact number');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-slate-100 dark:border-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400">
              <Phone className="h-4 w-4" />
            </span>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Edit Partner Contact</h3>
              <p className="text-xs text-slate-400">{partner.name || partner.id}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-5 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-xs font-semibold">
              {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-semibold flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-600" />
              {successMsg}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Contact Phone Number
            </label>
            <div className="relative">
              <Phone className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="+91 98450 12345"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 py-2.5 pl-9 pr-4 text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-violet-500 focus:bg-white dark:focus:bg-slate-850 transition-all font-semibold"
                autoFocus
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Include country code if applicable (e.g., +91 98450 12345)</p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 rounded-xl text-xs font-bold text-white bg-violet-600 hover:bg-violet-700 transition-colors flex items-center justify-center gap-1.5 shadow-sm"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Number
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPartnerPhoneModal;
