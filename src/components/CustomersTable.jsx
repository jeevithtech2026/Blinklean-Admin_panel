import React, { useState, useMemo, useEffect } from 'react';
import { ShieldAlert, ArrowUpDown, ChevronLeft, ChevronRight, Search, UserCircle, MapPin, Phone, Calendar, MessageSquare, Edit3, Copy, Check } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import ExportButton from './ExportButton';
import EditCustomerModal from './EditCustomerModal';

const CustomersTable = ({ customers, onCustomerUpdated }) => {
  const { density } = useTheme();

  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, customers.length]);

  const formatAddress = (c) => {
    if (!c) return 'Location Unknown';
    if (typeof c.address === 'object' && c.address !== null) {
      const parts = [
        c.address.houseNumber || c.address.building || c.address.doorNo,
        c.address.street || c.address.streetAddress || c.address.line1,
        c.address.area || c.address.locality || c.address.line2,
        c.address.city || c.city,
        c.address.state,
        c.address.pincode || c.address.zipCode ? `PIN: ${c.address.pincode || c.address.zipCode}` : null
      ].filter(Boolean);
      return parts.length > 0 ? parts.join(', ') : 'Location Unknown';
    }
    return c.fullAddress || c.address || c.formattedAddress || c.location || c.city || 'Location Unknown';
  };

  const formatPhone = (c) => {
    const raw = c.phone || c.phoneNumber || c.mobile || c.contact || c.phoneNo || '';
    if (!raw || raw === '—') return '—';
    return raw;
  };

  const getCleanPhone = (phoneStr) => {
    if (!phoneStr || phoneStr === '—') return null;
    return phoneStr.replace(/[^0-9]/g, '');
  };

  const handleCopyAddress = (id, text) => {
    if (!text || text === 'Location Unknown') return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredCustomers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return customers;
    return customers.filter((c) =>
      (c.name || '').toLowerCase().includes(query) ||
      (c.email || '').toLowerCase().includes(query) ||
      formatPhone(c).toLowerCase().includes(query) ||
      formatAddress(c).toLowerCase().includes(query) ||
      (c.servicePin || '').toLowerCase().includes(query) ||
      (c.userId || c.id || '').toLowerCase().includes(query)
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
    return sortDirection === 'asc' ? <span className="text-indigo-600">▲</span> : <span className="text-indigo-600">▼</span>;
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
      Phone: formatPhone(c),
      Location: formatAddress(c),
      Service_PIN: c.servicePin || 'N/A',
      Total_Bookings: c.totalBookings || 0,
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
            placeholder="Search by name, phone, exact address, PIN or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-96 bg-transparent text-sm text-slate-700 dark:text-slate-350 outline-none placeholder-slate-400 dark:placeholder-slate-600"
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
                <th className={thPadding}>Contact Phone & Actions</th>
                <th className={thPadding}>Exact Physical Address</th>
                <th className={thPadding} onClick={() => handleSort('createdAt')}>
                  <div className="flex items-center gap-1.5 cursor-pointer">Registered {renderSortIndicator('createdAt')}</div>
                </th>
                <th className={`${thPadding} text-right`}>Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y divide-slate-100 dark:divide-slate-800 ${bodyTextSize}`}>
              {paginatedCustomers.length > 0 ? (
                paginatedCustomers.map((customer) => {
                  const phoneStr = formatPhone(customer);
                  const cleanPhone = getCleanPhone(phoneStr);
                  const addressStr = formatAddress(customer);
                  const hasPhone = phoneStr !== '—' && phoneStr !== '';

                  return (
                    <tr key={customer.userId || customer.id || Math.random()} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/30 transition-colors">
                      {/* Customer Info */}
                      <td className={tdPadding}>
                        <div className="flex items-center gap-3">
                          {customer.avatar ? (
                            <img src={customer.avatar} alt="Avatar" className={`${avatarSize} object-cover`} />
                          ) : (
                            <div className={`flex items-center justify-center bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 font-bold text-indigo-700 dark:text-indigo-400 ${avatarSize}`}>
                              {(customer.name || customer.email || '?').substring(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 dark:text-white leading-tight">{customer.name || 'Anonymous User'}</span>
                              {customer.isVerified && (
                                <span className="inline-flex items-center rounded-md bg-emerald-50 dark:bg-emerald-950/30 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30">Verified</span>
                              )}
                              {customer.totalBookings > 0 && (
                                <span className="inline-flex items-center rounded-md bg-violet-50 dark:bg-violet-950/30 px-1.5 py-0.5 text-[9px] font-bold text-violet-700 dark:text-violet-300 border border-violet-100 dark:border-violet-900/30">
                                  {customer.totalBookings} {customer.totalBookings === 1 ? 'Job' : 'Jobs'}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] font-mono font-semibold text-slate-500">ID: {customer.userId || customer.id || 'N/A'}</span>
                              {customer.servicePin && customer.servicePin !== '—' && (
                                <span className="text-[9px] font-mono font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 px-1.5 py-0.5 rounded border border-amber-100 dark:border-amber-900/30">
                                  PIN: {customer.servicePin}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Contact Phone & Quick Actions */}
                      <td className={tdPadding}>
                        <div className="flex flex-col gap-1.5">
                          {hasPhone ? (
                            <div className="flex items-center gap-2">
                              <a
                                href={`tel:${phoneStr}`}
                                className="inline-flex items-center gap-1.5 font-bold text-indigo-600 dark:text-indigo-400 text-xs hover:underline"
                                title="Click to call customer"
                              >
                                <Phone className="h-3.5 w-3.5 shrink-0" />
                                <span>{phoneStr}</span>
                              </a>
                              {cleanPhone && (
                                <a
                                  href={`https://wa.me/91${cleanPhone.slice(-10)}?text=${encodeURIComponent(`Hello ${customer.name || 'Customer'}, greetings from Blinklean! We are contacting you regarding our services.`)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-[10px] font-bold hover:bg-emerald-100 transition-colors"
                                  title="Send WhatsApp message"
                                >
                                  <MessageSquare className="h-3 w-3" />
                                  <span>WhatsApp</span>
                                </a>
                              )}
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setSelectedCustomer(customer);
                                setIsEditModalOpen(true);
                              }}
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:text-amber-700 cursor-pointer"
                            >
                              <Phone className="h-3 w-3" />
                              <span>+ Add Phone Number</span>
                            </button>
                          )}
                          {customer.email && customer.email !== '—' && (
                            <div className="flex items-center gap-1.5 font-medium text-slate-500 dark:text-slate-400 text-[11px]">
                              <UserCircle className="h-3 w-3" />
                              <span>{customer.email}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Location / Full Physical Address */}
                      <td className={tdPadding}>
                        <div className="flex items-start gap-2 max-w-md group">
                          <MapPin className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <p className="font-semibold text-slate-800 dark:text-slate-200 text-xs leading-relaxed">
                              {addressStr}
                            </p>
                            {customer.city && (
                              <span className="inline-block mt-1 text-[10px] font-semibold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                                Area: {customer.city} {customer.pincode ? `(${customer.pincode})` : ''}
                              </span>
                            )}
                          </div>
                          {addressStr !== 'Location Unknown' && (
                            <button
                              onClick={() => handleCopyAddress(customer.userId, addressStr)}
                              className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                              title="Copy full address"
                            >
                              {copiedId === customer.userId ? (
                                <Check className="h-3.5 w-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="h-3.5 w-3.5" />
                              )}
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Registered Date */}
                      <td className={tdPadding}>
                        <div className="flex items-center gap-1.5 font-medium text-slate-600 dark:text-slate-350 text-xs">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          {customer.createdAt ? new Date(customer.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className={`${tdPadding} text-right`}>
                        <button
                          onClick={() => {
                            setSelectedCustomer(customer);
                            setIsEditModalOpen(true);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 text-xs font-semibold transition-colors cursor-pointer"
                          title="Edit Customer Contact & Address"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                          <span>Edit</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-400 dark:text-slate-500">
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
              {[10, 25, 50, 100].map((size) => (
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

      <EditCustomerModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        customer={selectedCustomer}
        onUpdate={(userId, updatedData) => {
          if (onCustomerUpdated) {
            onCustomerUpdated(userId, updatedData);
          }
        }}
      />
    </div>
  );
};

export default CustomersTable;
