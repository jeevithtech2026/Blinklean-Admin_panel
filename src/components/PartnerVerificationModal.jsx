import React, { useState, useEffect } from 'react';
import { X, CheckCircle, XCircle, FileText, ExternalLink, Loader2, Award, User, Phone, MapPin, Truck } from 'lucide-react';
import axiosInstance from '../api/axiosInstance';

const PartnerVerificationModal = ({ isOpen, onClose, partner, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (partner && isOpen) {
      setErrorMsg('');
      setSuccessMsg('');
    }
  }, [partner, isOpen]);

  if (!isOpen || !partner) return null;

  const handleVerify = async (kycStatus, status) => {
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      await axiosInstance.put(`/api/v1/data/partners/${partner.id}/verify`, {
        kycStatus,
        status
      });

      setSuccessMsg(`Partner KYC ${kycStatus === 'approved' ? 'approved' : 'rejected'} successfully.`);
      
      if (onUpdate) {
        onUpdate(partner.id, kycStatus, status);
      }

      // Close modal after 1.5 seconds on success
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Failed to update verification status:', err);
      setErrorMsg(err.response?.data?.error || err.message || 'Failed to update verification status');
    } finally {
      setLoading(false);
    }
  };

  const getDocLabel = (key) => {
    const labels = {
      aadhaarFront: 'Aadhaar Front',
      aadhaarBack: 'Aadhaar Back',
      license: 'Driving License',
      pan: 'PAN Card',
      selfie: 'Selfie Photograph'
    };
    return labels[key] || key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
  };

  // Check if there are any documents
  const hasDocuments = partner.photoUrl || (partner.documentUrls && Object.keys(partner.documentUrls).length > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Partner Verification</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Manually review document submissions for {partner.name}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Content Area */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Alerts */}
          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-100 text-rose-700 text-xs font-semibold">
              {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-semibold flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-600" />
              {successMsg}
            </div>
          )}

          {/* Profile Overview Card */}
          <div className="rounded-xl border border-slate-100 dark:border-slate-850 p-4 bg-slate-50/50 dark:bg-slate-900/50 grid gap-4 sm:grid-cols-2">
            <div className="flex gap-3">
              <span className="rounded-xl bg-violet-50 dark:bg-violet-950/30 border border-violet-100 dark:border-violet-900/40 p-2.5 text-violet-600 shrink-0 h-10 w-10 flex items-center justify-center">
                <User className="h-5 w-5" />
              </span>
              <div>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold block uppercase tracking-wider">Full Name & Email</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white block mt-0.5">{partner.name || '—'}</span>
                <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 block">{partner.email || '—'}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <span className="rounded-xl bg-violet-50 dark:bg-violet-950/30 border border-violet-100 dark:border-violet-900/40 p-2.5 text-violet-600 shrink-0 h-10 w-10 flex items-center justify-center">
                <Phone className="h-5 w-5" />
              </span>
              <div>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold block uppercase tracking-wider">Phone & Location</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white block mt-0.5">{partner.phoneNumber || '—'}</span>
                <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 block flex items-center gap-0.5"><MapPin className="h-3.5 w-3.5 inline" /> {partner.city || '—'}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <span className="rounded-xl bg-violet-50 dark:bg-violet-950/30 border border-violet-100 dark:border-violet-900/40 p-2.5 text-violet-600 shrink-0 h-10 w-10 flex items-center justify-center">
                <Award className="h-5 w-5" />
              </span>
              <div>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold block uppercase tracking-wider">Skills / Categories</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {(partner.skills || []).length > 0 ? (
                    partner.skills.map((skill) => (
                      <span key={skill} className="inline-block rounded-md px-1.5 py-0.5 text-[10px] font-semibold bg-violet-50 dark:bg-violet-950 text-violet-650 dark:text-violet-300">
                        {skill}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-500">None declared</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <span className="rounded-xl bg-violet-50 dark:bg-violet-950/30 border border-violet-100 dark:border-violet-900/40 p-2.5 text-violet-600 shrink-0 h-10 w-10 flex items-center justify-center">
                <Truck className="h-5 w-5" />
              </span>
              <div>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold block uppercase tracking-wider">Vehicle Details</span>
                <span className="text-xs text-slate-650 dark:text-slate-350 block mt-1 leading-normal font-semibold">
                  {partner.vehicleDetails || 'No vehicle registered'}
                </span>
              </div>
            </div>
          </div>

          {/* Documents Section */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider text-xs">Uploaded KYC Documents</h4>
            
            {hasDocuments ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Photo / Selfie */}
                {partner.photoUrl && (
                  <div className="border border-slate-100 dark:border-slate-800 rounded-xl p-3.5 flex flex-col justify-between bg-white dark:bg-slate-900">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-indigo-50 dark:bg-indigo-950/30 p-2 text-indigo-600 shrink-0">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-900 dark:text-white block">{getDocLabel('selfie')}</span>
                        <span className="text-[10px] text-slate-400">Profile / Verification selfie</span>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <a 
                        href={partner.photoUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-bold text-violet-650 hover:text-violet-700 hover:underline"
                      >
                        Open document <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                )}

                {/* Other Documents */}
                {partner.documentUrls && Object.entries(partner.documentUrls).map(([key, url]) => (
                  <div key={key} className="border border-slate-100 dark:border-slate-800 rounded-xl p-3.5 flex flex-col justify-between bg-white dark:bg-slate-900">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-indigo-50 dark:bg-indigo-950/30 p-2 text-indigo-600 shrink-0">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-900 dark:text-white block">{getDocLabel(key)}</span>
                        <span className="text-[10px] text-slate-400">Proof of Identification</span>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <a 
                        href={url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-bold text-violet-650 hover:text-violet-700 hover:underline"
                      >
                        Open document <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="border border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-6 text-center text-slate-400 dark:text-slate-500 text-xs">
                No digital documents were uploaded by this partner. You can verify based on phone, email, and offline documents.
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/20 shrink-0 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl font-bold text-sm text-slate-700 dark:text-slate-300 bg-white border border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:hover:bg-slate-700 transition-colors"
          >
            Cancel
          </button>
          
          <button
            type="button"
            disabled={loading}
            onClick={() => handleVerify('rejected', 'pending')}
            className="flex-1 py-2.5 rounded-xl font-bold text-sm text-rose-700 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:text-rose-400 dark:hover:bg-rose-950/30 transition-colors flex items-center justify-center gap-2 border border-rose-100/50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <XCircle className="h-4.5 w-4.5" /> Reject KYC
              </>
            )}
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={() => handleVerify('approved', 'active')}
            className="flex-1 py-2.5 rounded-xl font-bold text-sm text-white bg-violet-600 hover:bg-violet-700 transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <CheckCircle className="h-4.5 w-4.5" /> Approve & Activate
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

export default PartnerVerificationModal;
