import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SystemHealthBanner from '../components/SystemHealthBanner';
import SettingsPanel from '../components/SettingsPanel';
import { 
  LayoutDashboard, Users, Truck, LogOut, Calendar, ListPlus, Tag, MessageSquare, MapPin,
  Menu, X, Bell, User, Search, ShieldCheck, Database, Gauge, Archive, Lock, Bug, Key, IndianRupee, Wallet
} from 'lucide-react';

const DashboardLayout = () => {
  const { logout, adminUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const menuItems = [
    { name: 'Overview Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Customer Directory', path: '/dashboard/customers', icon: Users },
    { name: 'Partner Management', path: '/dashboard/partners', icon: User },
    { name: 'Partner Schedules', path: '/dashboard/tracking', icon: MapPin },
    { name: 'Service Bookings', path: '/dashboard/bookings', icon: Calendar },
    { name: 'Financials & Payments', path: '/dashboard/financials', icon: IndianRupee },
    { name: 'Partner Payouts', path: '/dashboard/payouts', icon: Wallet },
    { name: 'Service Catalog', path: '/dashboard/services', icon: ListPlus },
    { name: 'Discounts & Promos', path: '/dashboard/coupons', icon: Tag },
    { name: 'Customer Feedback', path: '/dashboard/feedbacks', icon: MessageSquare },
    { name: 'Logistics Analytics', path: '/dashboard/logistics', icon: Truck },
    { name: 'Audit Logs', path: '/dashboard/audit-logs', icon: ShieldCheck },
    { name: 'Disaster Recovery & Backups', path: '/dashboard/disaster-recovery', icon: Database },
    { name: 'System Performance', path: '/dashboard/performance', icon: Gauge },
    { name: 'Data Retention & Archival', path: '/dashboard/retention', icon: Archive },
    { name: 'Rate Limiting & Security', path: '/dashboard/rate-limiting', icon: Lock },
    { name: 'Dependency Security & CVEs', path: '/dashboard/security-audit', icon: Bug },
    { name: 'Webhooks & Developer APIs', path: '/dashboard/webhooks', icon: Key },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex md:w-64 md:flex-col bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5 px-6 py-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600 text-white font-black tracking-wider shadow-md">
             BL
          </div>
          <span className="font-bold text-lg text-slate-900 dark:text-white tracking-tight">Blinklean Admin</span>
        </div>

        {/* Sidebar Nav Items */}
        <nav className="flex-1 overflow-y-auto space-y-1.5 px-4 py-6">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  isActive 
                    ? 'bg-violet-600 text-white shadow-sm shadow-violet-200' 
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <item.icon className="h-4.5 w-4.5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User Info & Logout */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3 px-2 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 mb-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-400 font-bold text-sm">
              {adminUser?.username?.substring(0, 2).toUpperCase() || 'AD'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{adminUser?.username || 'Admin'}</p>
              <p className="text-[10px] text-slate-400 dark:text-slate-550 font-semibold truncate">{adminUser?.role || 'Super Admin'}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all cursor-pointer"
          >
            <LogOut className="h-4.5 w-4.5" />
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
            
            <div className="flex items-center gap-2.5 py-2 mb-8 border-b border-slate-100 dark:border-slate-800">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600 text-white font-black tracking-wider shadow-md">
                BL
              </div>
              <span className="font-bold text-lg text-slate-900 dark:text-white tracking-tight">Blinklean Admin</span>
            </div>

            <nav className="flex-1 overflow-y-auto space-y-1.5">
              {menuItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    onClick={() => setIsMobileOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                      isActive 
                        ? 'bg-violet-600 text-white shadow-sm shadow-violet-200' 
                        : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <item.icon className="h-4.5 w-4.5" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            <div className="mt-auto border-t border-slate-100 dark:border-slate-800 pt-4">
              <div className="flex items-center gap-3 px-2 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 mb-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-400 font-bold text-sm">
                  {adminUser?.username?.substring(0, 2).toUpperCase() || 'AD'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{adminUser?.username || 'Admin'}</p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-550 font-semibold truncate">{adminUser?.role || 'Super Admin'}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all cursor-pointer"
              >
                <LogOut className="h-4.5 w-4.5" />
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
            
            {/* Search Bar */}
            <div className="relative hidden sm:block w-64 md:w-80">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
              <input 
                type="text" 
                placeholder="Global search operations..." 
                className="w-full rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-950 py-2 pl-9 pr-4 text-xs text-slate-700 dark:text-slate-300 placeholder-slate-400 dark:placeholder-slate-650 outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-slate-300 dark:focus:border-slate-700 transition-all"
              />
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
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-855 text-slate-600 dark:text-slate-400 border border-slate-200/50 dark:border-slate-800">
                <User className="h-4.5 w-4.5" />
              </div>
              <div className="hidden lg:block text-left">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight">{adminUser?.username || 'Admin'}</p>
                <p className="text-[9px] font-semibold text-slate-400 dark:text-slate-550">{adminUser?.role || 'Super Admin'}</p>
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
