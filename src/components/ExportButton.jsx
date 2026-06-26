import React, { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { exportToCSV } from '../utils/csvExporter';
import { triggerGlobalNotification } from '../context/NotificationContext';

const ExportButton = ({ type, getData }) => {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    try {
      setExporting(true);
      console.log(`[ExportButton] Generating telemetry CSV for: ${type}`);
      
      const dataset = await getData();
      if (!dataset || !dataset.length) {
        triggerGlobalNotification(`No active data found to export for "${type}".`, 'warning');
        return;
      }

      const success = exportToCSV(dataset, `${type}_report`);
      if (success) {
        triggerGlobalNotification(`CSV report for "${type}" successfully compiled and downloaded.`, 'success');
      } else {
        triggerGlobalNotification(`Browser rejected file anchor creation. Failed to export CSV.`, 'error');
      }
    } catch (error) {
      console.error(`[ExportButton] Error generating CSV for ${type}:`, error);
      triggerGlobalNotification(`Export compilation failed: ${error.message || 'Unknown state'}.`, 'error');
    } finally {
      setExporting(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={exporting}
      className="flex items-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 text-xs font-semibold shadow-sm hover:shadow-md transition-all duration-250 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
    >
      {exporting ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Download className="h-3.5 w-3.5" />
      )}
      <span>{exporting ? 'Exporting...' : 'Export CSV'}</span>
    </button>
  );
};

export default ExportButton;
