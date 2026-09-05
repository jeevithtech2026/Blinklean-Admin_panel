import React, { useState, useMemo } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SystemHealthBanner from '../components/SystemHealthBanner';
import SettingsPanel from '../components/SettingsPanel';
import { 
  LayoutDashboard, Users, UserCheck, Calendar, MapPin, ListPlus, Tag, MessageSquare, 
  DollarSign, Wallet, ShieldCheck, Truck, FileText, Gauge, Database, Archive, 
  Lock, Bug, Key, LogOut, Menu, X, Bell, User, Search, ChevronRight
} from 'lucide-react';

const DashboardLayout = () => {
  const { logout, adminUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const navSections = [
    {
      title: 'Core Operations',
      items: [
        { name: 'Overview Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { name: 'Users & Customers', path: '/dashboard/customers', icon: Users, badge: 'Users' },
        { name: 'Partner Management', path: '/dashboard/partners', icon: UserCheck, badge: 'Partners' },
        { name: 'Service Bookings', path: '/dashboard/bookings', icon: Calendar, badge: 'Bookings' },
        { name: 'Partner Schedules', path: '/dashboard/tracking', icon: MapPin },
      ]
    },
    {
      title: 'Services & Growth',
      items: [
        { name: 'Service Catalog', path: '/dashboard/services', icon: ListPlus },
        { name: 'Coupons & Promos', path: '/dashboard/coupons', icon: Tag },
        { name: 'Customer Feedbacks', path: '/dashboard/feedbacks', icon: MessageSquare },
      ]
    },
    {
      title: 'Financial Management',
      items: [
        { name: 'Financials & Revenue', path: '/dashboard/financials', icon: DollarSign },
        { name: 'Partner Payouts', path: '/dashboard/payouts', icon: Wallet },
      ]
    },
    {
      title: 'Operations & Health',
      items: [
        { name: 'Verification Codes', path: '/dashboard/verification-codes', icon: ShieldCheck },
        { name: 'Logistics Analytics', path: '/dashboard/logistics', icon: Truck },
        { name: 'Audit Logs', path: '/dashboard/audit-logs', icon: FileText },
        { name: 'System Performance', path: '/dashboard/performance', icon: Gauge },
        { name: 'Disaster Recovery', path: '/dashboard/disaster-recovery', icon: Database },
        { name: 'Data Retention', path: '/dashboard/retention', icon: Archive },
        { name: 'Rate Limiting', path: '/dashboard/rate-limiting', icon: Lock },
        { name: 'Security Audit', path: '/dashboard/security-audit', icon: Bug },
        { name: 'Webhook Settings', path: '/dashboard/webhooks', icon: Key },
      ]
    }
  ];

  // Flattened items for global search
  const allNavItems = useMemo(() => {
    return navSections.flatMap(section => section.items.map(item => ({ ...item, section: section.title })));
  }, [navSections]);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase().trim();
    return allNavItems.filter(item => 
      item.name.toLowerCase().includes(query) ||
      (item.badge && item.badge.toLowerCase().includes(query)) ||
      item.section.toLowerCase().includes(query)
    );
  }, [searchQuery, allNavItems]);

  const isItemActive = (path) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard' || location.pathname === '/dashboard/';
    }
    if (path === '/dashboard/customers') {
      return location.pathname === '/dashboard/customers' || location.pathname === '/dashboard/users';
    }
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const renderNavSection = (section, isMobile = false) => (
    <div key={section.title} className="mb-4">
      <div className="px-4 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
        {section.title}
      </div>
      <div className="space-y-1">
        {section.items.map((item) => {
          const isActive = isItemActive(item.path);
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              to={item.path}
              onClick={() => isMobile && setIsMobileOpen(false)}
              className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                isActive 
                  ? 'bg-violet-600 text-white shadow-sm shadow-violet-200 dark:shadow-none' 
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{item.name}</span>
              </div>
              {item.badge && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                  isActive
                    ? 'bg-violet-700/60 text-violet-100'
                    : 'bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 border border-violet-100/50 dark:border-violet-900/30'
                }`}>
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex md:w-64 md:flex-col bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 shrink-0">
        <div className="flex items-center gap-2.5 px-6 py-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600 text-white font-black tracking-wider shadow-md">
             BL
          </div>
          <div>
            <span className="font-bold text-base text-slate-900 dark:text-white tracking-tight block leading-tight">Blinklean Admin</span>
            <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">Service Operations Hub</span>
          </div>
        </div>

        {/* Sidebar Nav Items */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-2">
          {navSections.map((section) => renderNavSection(section))}
        </nav>

        {/* User Info & Logout */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3 px-2 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 mb-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-400 font-bold text-sm">
              {adminUser?.username?.substring(0, 2).toUpperCase() || 'AD'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{adminUser?.username || 'Admin'}</p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold truncate">{adminUser?.role || 'Super Admin'}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile Drawer (Sidebar on mobile) */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-xs">
          <div className="relative flex w-full max-w-xs flex-col bg-white dark:bg-slate-900 p-6 shadow-2xl">
            <div className="absolute top-4 right-4">
              <button 
                onClick={() => setIsMobileOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-350"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="flex items-center gap-2.5 py-2 mb-6 border-b border-slate-100 dark:border-slate-800">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600 text-white font-black tracking-wider shadow-md">
                BL
              </div>
              <span className="font-bold text-lg text-slate-900 dark:text-white tracking-tight">Blinklean Admin</span>
            </div>

            <nav className="flex-1 overflow-y-auto space-y-2">
              {navSections.map((section) => renderNavSection(section, true))}
            </nav>

            <div className="mt-auto border-t border-slate-100 dark:border-slate-800 pt-4">
              <div className="flex items-center gap-3 px-2 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 mb-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-400 font-bold text-sm">
                  {adminUser?.username?.substring(0, 2).toUpperCase() || 'AD'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{adminUser?.username || 'Admin'}</p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold truncate">{adminUser?.role || 'Super Admin'}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-950">
        {/* Top Header Bar */}
        <header className="flex h-16 items-center justify-between bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 px-6 md:px-8 shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMobileOpen(true)}
              className="rounded-lg p-1.5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-white md:hidden"
            >
              <Menu className="h-5.5 w-5.5" />
            </button>
            
            {/* Global Search Bar with Auto-complete Dropdown */}
            <div className="relative hidden sm:block w-72 md:w-96">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
              <input 
                type="text" 
                placeholder="Search users, partners, bookings, operations..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950 py-2 pl-9 pr-4 text-xs text-slate-700 dark:text-slate-300 placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-violet-400 dark:focus:border-violet-600 transition-all"
              />

              {/* Quick Navigation Search Dropdown */}
              {isSearchFocused && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden z-50">
                  <div className="p-2 border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Quick Navigation Matches ({searchResults.length})
                  </div>
                  <div className="max-h-60 overflow-y-auto p-1">
                    {searchResults.map((result) => {
                      const Icon = result.icon;
                      return (
                        <Link
                          key={result.name}
                          to={result.path}
                          onClick={() => {
                            setSearchQuery('');
                            setIsSearchFocused(false);
                          }}
                          className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-violet-50 dark:hover:bg-violet-950/40 hover:text-violet-700 dark:hover:text-violet-300 transition-colors"
                        >
                          <div className="flex items-center gap-2.5">
                            <Icon className="h-4 w-4 text-slate-400" />
                            <span>{result.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-400">{result.section}</span>
                            <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* System Health Banner Status Pills */}
            <div className="hidden lg:block">
              <SystemHealthBanner />
            </div>

            {/* Theme & Density Settings Customizer */}
            <SettingsPanel />

            {/* Notification Center */}
            <button className="relative rounded-xl p-2.5 text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-300 border border-slate-100 dark:border-slate-800 transition-all cursor-pointer">
              <Bell className="h-4.5 w-4.5" />
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-rose-500 border-2 border-white dark:border-slate-900"></span>
            </button>

            {/* Profile Dropdown Indicator */}
            <div className="flex items-center gap-3 pl-3 border-l border-slate-100 dark:border-slate-800">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/50 dark:border-slate-800">
                <User className="h-4.5 w-4.5" />
              </div>
              <div className="hidden lg:block text-left">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight">{adminUser?.username || 'Admin'}</p>
                <p className="text-[9px] font-semibold text-slate-400 dark:text-slate-500">{adminUser?.role || 'Super Admin'}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Content Viewport */}
        <main className="flex-1 overflow-y-auto px-6 py-6 md:px-8 md:py-8">
          <div className="mx-auto max-w-7xl animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
