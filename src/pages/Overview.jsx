import React from 'react';
import { 
  TrendingUp, Users, ShoppingBag, Award, 
  ArrowUpRight, ArrowDownRight, Clock, ShieldAlert 
} from 'lucide-react';

const Overview = () => {
  const stats = [
    { title: 'Total Revenue', value: '$24,890.00', change: '+14.2%', isPositive: true, icon: TrendingUp, color: 'text-emerald-600 bg-emerald-50 border border-emerald-100' },
    { title: 'Bookings Completed', value: '1,482', change: '+8.4%', isPositive: true, icon: ShoppingBag, color: 'text-violet-600 bg-violet-50 border border-violet-100' },
    { title: 'Active Partners', value: '184', change: '-2.1%', isPositive: false, icon: Users, color: 'text-amber-600 bg-amber-50 border border-amber-100' },
    { title: 'Completion Rate', value: '98.6%', change: '+0.8%', isPositive: true, icon: Award, color: 'text-sky-600 bg-sky-50 border border-sky-100' },
  ];

  const recentOrders = [
    { id: 'BL-9821', customer: 'Sarah Jenkins', service: 'Deep Cleaning', amount: '$120.00', status: 'Completed', partner: 'Marcus Vance' },
    { id: 'BL-9820', customer: 'David Miller', service: 'Express Clean', amount: '$45.00', status: 'In Progress', partner: 'Aisha Rahman' },
    { id: 'BL-9819', customer: 'Elena Rostova', service: 'Eco Sanitation', amount: '$85.00', status: 'Completed', partner: 'John Sterling' },
    { id: 'BL-9818', customer: 'Michael Chen', service: 'Deep Cleaning', amount: '$135.00', status: 'Pending', partner: 'Unassigned' },
    { id: 'BL-9817', customer: 'Amanda Ross', service: 'Express Clean', amount: '$45.00', status: 'Cancelled', partner: 'Kevin Hart' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-indigo-700 p-6 md:p-8 text-white shadow-lg">
        <div className="relative z-10 max-w-md">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Welcome back, Admin</h1>
          <p className="mt-2 text-violet-100 text-sm md:text-base">
            Track partner performance, check delivery routes, and review logistical health metrics.
          </p>
        </div>
        <div className="absolute top-0 right-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-violet-500/20 blur-2xl"></div>
        <div className="absolute bottom-0 right-1/4 -mb-16 h-48 w-48 rounded-full bg-indigo-400/20 blur-xl"></div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <div key={i} className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-500">{stat.title}</span>
              <span className={`rounded-xl p-2.5 ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </span>
            </div>
            <div className="mt-4 flex items-baseline justify-between">
              <span className="text-2xl font-bold text-slate-900">{stat.value}</span>
              <span className={`inline-flex items-center text-xs font-semibold ${stat.isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                {stat.isPositive ? <ArrowUpRight className="mr-0.5 h-3.5 w-3.5" /> : <ArrowDownRight className="mr-0.5 h-3.5 w-3.5" />}
                {stat.change}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Graphics & Info alerts */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* SVG Area Chart */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Weekly Performance</h2>
              <p className="text-xs text-slate-400">Logistics fulfillment timeline over 7 days</p>
            </div>
            <select className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 outline-none hover:border-slate-300">
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
            </select>
          </div>
          <div className="relative h-60 w-full">
            <svg className="h-full w-full" viewBox="0 0 600 220" preserveAspectRatio="none">
              <defs>
                <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <line x1="0" y1="40" x2="600" y2="40" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="0" y1="95" x2="600" y2="95" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="0" y1="150" x2="600" y2="150" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="0" y1="205" x2="600" y2="205" stroke="#f1f5f9" strokeWidth="1" />

              <path 
                d="M 10 205 L 10 160 Q 100 110, 200 140 T 400 80 L 500 120 T 590 60 L 590 205 Z" 
                fill="url(#chartGrad)" 
              />
              <path 
                d="M 10 160 Q 100 110, 200 140 T 400 80 L 500 120 T 590 60" 
                fill="none" 
                stroke="#8b5cf6" 
                strokeWidth="3" 
                strokeLinecap="round" 
              />

              <circle cx="200" cy="140" r="4.5" fill="#8b5cf6" stroke="#ffffff" strokeWidth="2" />
              <circle cx="400" cy="80" r="4.5" fill="#8b5cf6" stroke="#ffffff" strokeWidth="2" />
              <circle cx="500" cy="120" r="4.5" fill="#8b5cf6" stroke="#ffffff" strokeWidth="2" />
            </svg>
            <div className="mt-3 flex justify-between px-2 text-xs font-semibold text-slate-400">
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
              <span>Sun</span>
            </div>
          </div>
        </div>

        {/* Action Alerts */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 mb-4">Operations Monitor</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-4 rounded-xl bg-rose-50 p-4 border border-rose-100">
                <span className="rounded-lg bg-rose-100 p-2 text-rose-600">
                  <ShieldAlert className="h-5 w-5" />
                </span>
                <div>
                  <h4 className="text-sm font-semibold text-rose-900">2 Overload Regions</h4>
                  <p className="text-xs text-rose-700 mt-0.5 font-medium">Orders in Downtown are spike-surging. Surge-rate adjustment needed.</p>
                </div>
              </div>

              <div className="flex items-start gap-4 rounded-xl bg-amber-50 p-4 border border-amber-100">
                <span className="rounded-lg bg-amber-100 p-2 text-amber-600">
                  <Clock className="h-5 w-5" />
                </span>
                <div>
                  <h4 className="text-sm font-semibold text-amber-900">Pending Approvals</h4>
                  <p className="text-xs text-amber-700 mt-0.5 font-medium">5 new partner profiles are awaiting screening review.</p>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-100">
            <button className="w-full rounded-xl bg-slate-900 py-3 text-center text-xs font-semibold text-white transition-all hover:bg-slate-800">
              View System Log
            </button>
          </div>
        </div>
      </div>

      {/* Recent Orders table */}
      <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Logistics Dispatch Log</h2>
            <p className="text-xs text-slate-400">Updates from current routes</p>
          </div>
          <button className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-600 outline-none hover:bg-slate-50 transition-all">
            Download CSV
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <th className="px-6 py-4">Booking ID</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Service</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Assigned Partner</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {recentOrders.map((order, i) => (
                <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs font-bold text-slate-950">{order.id}</td>
                  <td className="px-6 py-4 font-medium text-slate-700">{order.customer}</td>
                  <td className="px-6 py-4 text-slate-500">{order.service}</td>
                  <td className="px-6 py-4 font-semibold text-slate-900">{order.amount}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${
                      order.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                      order.status === 'In Progress' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                      order.status === 'Pending' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                      'bg-rose-50 text-rose-700 border-rose-100'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-600 font-medium">{order.partner}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Overview;
