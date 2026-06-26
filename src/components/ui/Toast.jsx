import React, { useEffect } from 'react';
import { X, CheckCircle, AlertTriangle, XCircle, Info } from 'lucide-react';

const Toast = ({ message, type = 'info', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000); // 4 seconds auto-dismiss

    return () => clearTimeout(timer);
  }, [onClose]);

  // Design styles mapping based on notification type
  const typeStyles = {
    success: {
      bg: 'bg-emerald-50 border-emerald-100 text-emerald-800',
      iconColor: 'text-emerald-600',
      Icon: CheckCircle,
    },
    warning: {
      bg: 'bg-amber-50 border-amber-100 text-amber-800',
      iconColor: 'text-amber-600',
      Icon: AlertTriangle,
    },
    error: {
      bg: 'bg-rose-50 border-rose-100 text-rose-800',
      iconColor: 'text-rose-600',
      Icon: XCircle,
    },
    info: {
      bg: 'bg-blue-50 border-blue-100 text-blue-800',
      iconColor: 'text-blue-600',
      Icon: Info,
    },
  };

  const { bg, iconColor, Icon } = typeStyles[type] || typeStyles.info;

  return (
    <div className={`flex items-start gap-3 rounded-xl border p-4 shadow-lg transition-all duration-300 transform translate-x-0 ${bg}`}>
      <Icon className={`h-5 w-5 shrink-0 ${iconColor}`} />
      
      <div className="flex-1 text-xs font-semibold leading-relaxed">
        {message}
      </div>

      <button
        onClick={onClose}
        className="text-slate-400 hover:text-slate-600 transition-colors shrink-0 focus:outline-none cursor-pointer"
        aria-label="Close notification"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

export default Toast;
