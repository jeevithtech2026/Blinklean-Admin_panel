/**
 * Utility to export JSON data to a downloadable CSV file.
 * @param {Array<Object>} data - The dataset to convert and export.
 * @param {string} filenamePrefix - Prefix name for the generated CSV download.
 */
export const exportToCSV = (data, filenamePrefix = 'export') => {
  if (!data || !data.length) {
    console.warn('[CSV Exporter] No structured data present to compile.');
    return false;
  }

  // 1. Compile list of headers from the first data record
  const headers = Object.keys(data[0]);

  // 2. Format records, escaping character collisions (quotes, commas, newlines)
  const csvRows = [
    headers.join(','), // Header row
    ...data.map((row) =>
      headers
        .map((header) => {
          let val = row[header];
          if (val === null || val === undefined) {
            val = '';
          }
          
          // Format standard Date objects to YYYY-MM-DD
          if (val instanceof Date) {
            val = val.toISOString().split('T')[0];
          } else if (typeof val === 'string') {
            // Detect and normalize ISO timestamps to YYYY-MM-DD
            if (/^\d{4}-\d{2}-\d{2}T/.test(val)) {
              val = val.split('T')[0];
            }
            // Double-escape inner quotes and wrap string in outer quotes if comma/quote exists
            val = val.replace(/"/g, '""');
            if (val.includes(',') || val.includes('"') || val.includes('\n')) {
              val = `"${val}"`;
            }
          }
          return val;
        })
        .join(',')
    ),
  ];

  // 3. Compile CSV content block
  const csvContent = csvRows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

  // 4. Construct output filename stamped with local timestamp (YYYY-MM-DD_HH-MM-SS)
  const now = new Date();
  const dateString = now.toISOString().split('T')[0];
  const timeString = now.toTimeString().split(' ')[0].replace(/:/g, '-');
  const filename = `${filenamePrefix}_${dateString}_${timeString}.csv`;

  // 5. Trigger client-side native anchor tag download sequence
  const anchor = document.createElement('a');
  if (anchor.download !== undefined) {
    const url = URL.createObjectURL(blob);
    anchor.setAttribute('href', url);
    anchor.setAttribute('download', filename);
    anchor.style.visibility = 'hidden';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    console.log(`[CSV Exporter] Successfully exported ${data.length} records to ${filename}`);
    return true;
  }
  
  return false;
};
