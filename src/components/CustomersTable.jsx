import React, { useState, useMemo, useEffect } from 'react';
import { ShieldAlert, ArrowUpDown, ChevronLeft, ChevronRight, Search, UserCircle, MapPin, Phone, Calendar } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import ExportButton from './ExportButton';

const CustomersTable = ({ customers }) => {
  const { density } = useTheme();

  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, customers.length]);

  const filteredCustomers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return customers;
    return customers.filter((c) =>
      (c.name || '').toLowerCase().includes(query) ||
      (c.email || '').toLowerCase().includes(query) ||
      (c.phone || '').toLowerCase().includes(query) ||
      (c.userId || '').toLowerCase().includes(query)
    );
  }, [customers, searchQuery]);

  const sortedCustomers = useMemo(() => {
    if (!sortField || !sortDirection) return filteredCustomers;
    return [...filteredCustomers].sort((a, b) => {
      let valA = (a[sortField] || '').toString().toLowerCase();
      let valB = (b[sortField] || '').toString().toLowerCase();

      if (sortDirection === 'asc') return valA < valB ? -1 : valA > valB ? 1 : 0;
      return valA > valB ? -1 : valA < valB ? 1 : 0;
    });
  }, [filteredCustomers, sortField, sortDirection]);

  const paginatedCustomers = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return sortedCustomers.slice(start, start + rowsPerPage);
  }, [sortedCustomers, currentPage, rowsPerPage]);

  const totalPages = Math.max(1, Math.ceil(sortedCustomers.length / rowsPerPage));

  const handleSort = (field) => {
    if (sortField !== field) { setSortField(field); setSortDirection('asc'); }
    else if (sortDirection === 'asc') setSortDirection('desc');
    else { setSortField(null); setSortDirection(null); }
  };

  const renderSortIndicator = (field) => {
    if (sortField !== field) return <ArrowUpDown className="h-3 w-3 text-slate-300 dark:text-slate-600" />;
    return sortDirection === 'asc' ? <span className="text-violet-600">▲</span> : <span className="text-violet-600">▼</span>;
  };

  const isCompact = density === 'compact';
  const thPadding = isCompact ? 'px-4 py-2.5 text-[10px]' : 'px-6 py-4 text-xs';
  const tdPadding = isCompact ? 'px-4 py-2' : 'px-6 py-4';
  const bodyTextSize = isCompact ? 'text-xs' : 'text-sm';
  const avatarSize = isCompact ? 'h-7 w-7 text-xs rounded-lg' : 'h-9 w-9 text-sm rounded-xl';

  const exportData = async () => {
    return filteredCustomers.map(c => ({
      Customer_ID: c.userId || c.id || 'N/A',
      Name: c.name || 'Anonymous User',
      Email: c.email || 'N/A',
      Phone: c.phone || 'N/A',
      Location: c.city || c.address || 'Unknown',
      Registered_Date: c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'
    }));
  };

  return (
    <div className="space-y-4">
      {/* Search and Export */}
      <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Search className="h-4.5 w-4.5 text-slate-400 dark:text-slate-500 shrink-0" />
          <input
            type="text"
            placeholder="Search customers by name, email, phone or user ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-80 bg-transparent text-sm text-slate-700 dark:text-slate-350 outline-none placeholder-slate-400 dark:placeholder-slate-600"
          />
        </div>
        <ExportButton type="Customers" getData={exportData} />
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/75 dark:bg-slate-850/50 border-b border-slate-100 dark:border-slate-800 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider select-none">
                <th className={thPadding} onClick={() => handleSort('name')}>
                  <div className="flex items-center gap-1.5 cursor-pointer">Customer {renderSortIndicator('name')}</div>
                </th>
                <th className={thPadding}>Contact Info</th>
                <th className={thPadding}>Location</th>
                <th className={thPadding} onClick={() => handleSort('createdAt')}>
                  <div className="flex items-center gap-1.5 cursor-pointer">Registered {renderSortIndicator('createdAt')}</div>
                </th>
              </tr>
            </thead>
            <tbody className={`divide-y divide-slate-100 dark:divide-slate-800 ${bodyTextSize}`}>
              {paginatedCustomers.length > 0 ? (
                paginatedCustomers.map((customer) => (
                  <tr key={customer.userId || customer.id || Math.random()} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/30 transition-colors">
                    {/* Customer Info */}
                    <td className={tdPadding}>
                      <div className="flex items-center gap-3">
                        {customer.avatar ? (
                          <img src={customer.avatar} alt="Avatar" className={`${avatarSize} object-cover`} />
                        ) : (
                          <div className={`flex items-center justify-center bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 font-bold text-blue-700 dark:text-blue-400 ${avatarSize}`}>
                            {(customer.name || customer.email || '?').substring(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white leading-tight">{customer.name || 'Anonymous User'}</div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] font-mono font-semibold text-slate-500">ID: {customer.userId || customer.id || 'N/A'}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    {/* Contact Info */}
                    <td className={tdPadding}>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300 text-xs">
                          <UserCircle className="h-3.5 w-3.5 text-slate-400" />
                          {customer.email || '—'}
                        </div>
                        <div className="flex items-center gap-1.5 font-medium text-slate-600 dark:text-slate-400 text-xs">
                          <Phone className="h-3.5 w-3.5 text-slate-400" />
                          {customer.phone || '—'}
                        </div>
                      </div>
                    </td>
                    {/* Location */}
                    <td className={tdPadding}>
                      <div className="flex items-center gap-1.5 font-medium text-slate-600 dark:text-slate-350">
                        <MapPin className="h-4 w-4 text-slate-400" />
                        {customer.city || customer.address || 'Location Unknown'}
                      </div>
                    </td>
                    {/* Registered Date */}
                    <td className={tdPadding}>
                      <div className="flex items-center gap-1.5 font-medium text-slate-600 dark:text-slate-350">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        {customer.createdAt ? new Date(customer.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-slate-400 dark:text-slate-500">
                    <div className="flex flex-col items-center gap-3">
                      <ShieldAlert className="h-9 w-9 text-slate-300 dark:text-slate-700" />
                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-300">No records found</h4>
                      <p className="text-xs text-slate-500 max-w-xs mx-auto leading-normal">
                        No customers match your current search criteria or the database is empty.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="border-t border-slate-100 dark:border-slate-800 px-6 py-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-slate-50/50 dark:bg-slate-850/20 text-xs font-semibold text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-4">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Rows per page:</span>
            <select
              value={rowsPerPage}
              onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
              className="bg-transparent font-bold text-slate-700 dark:text-slate-350 outline-none cursor-pointer border border-slate-200 dark:border-slate-800 px-2.5 py-1 rounded-lg"
            >
              {[5, 10, 25, 50].map((size) => (
                <option key={size} value={size} className="bg-white dark:bg-slate-900">{size} rows</option>
              ))}
            </select>
          </div>
          <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
            <span>Page <span className="font-bold text-slate-800 dark:text-slate-200">{currentPage}</span> of <span className="font-bold text-slate-800 dark:text-slate-200">{totalPages}</span> ({sortedCustomers.length} customers)</span>
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
    </div>
  );
};

export default CustomersTable;
