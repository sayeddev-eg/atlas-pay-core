"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { 
  ArrowUpRight, ArrowDownRight, Activity, 
  Search, Bell, ShieldCheck, MoreHorizontal, Loader2,
  TerminalSquare
} from "lucide-react";
import { 
  AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip 
} from "recharts";

// 1. Separation of Concerns: Mock API Call
// في المشاريع الحقيقية، ده بيكون Custom Hook زي useQuery أو Server Action
interface DashboardData {
  totalBalance: number; // Stored in cents (Zero Floating-Point)
  activeTenants: number;
  failedTransactions: number;
  recentActivity: Array<{
    id: string;
    type: string;
    amount: number;
    status: string;
    date: string;
  }>;
}

const fetchDashboardStats = async (): Promise<DashboardData> => {
  return new Promise((resolve) => {
    setTimeout(() => resolve({
      totalBalance: 1245000, // Stored in minor units (12,450.00 USD)
      activeTenants: 12,
      failedTransactions: 0,
      recentActivity: [
        { id: "tx_1n9x", type: "DEPOSIT", amount: 500000, status: "COMMITTED", date: "2026-03-27T10:00:00Z" },
        { id: "tx_1n9y", type: "WITHDRAWAL", amount: -15000, status: "COMMITTED", date: "2026-03-27T11:30:00Z" },
        { id: "tx_1n9z", type: "TRANSFER", amount: -25000, status: "REVERSED", date: "2026-03-27T14:15:00Z" },
      ]
    }), 600); // 600ms realistic network delay simulation
  });
};

const formatCurrency = (cents: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(cents / 100);
};

export default function ProfessionalDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    fetchDashboardStats().then((res) => {
      if (isMounted) {
        setData(res);
        setIsLoading(false);
      }
    });
    // Cleanup function to prevent memory leaks during unmount
    return () => { isMounted = false; };
  }, []);

  // Memoizing chart data to prevent unnecessary re-renders
  const chartData = useMemo(() => [
    { time: "00:00", value: 10000 },
    { time: "04:00", value: 10500 },
    { time: "08:00", value: 10200 },
    { time: "12:00", value: 11800 },
    { time: "16:00", value: 12450 },
    { time: "20:00", value: 12450 }
  ], []);

  if (isLoading || !data) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-6 h-6 text-neutral-400 animate-spin" />
        <span className="text-xs font-mono text-neutral-500">Loading ledger state...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-neutral-200 font-sans" dir="rtl">
      
      {/* Navbar: Clean, Minimal, Functional (Stripe/Linear Style) */}
      <nav className="border-b border-neutral-800 bg-[#0A0A0A]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center text-white group-hover:border-neutral-700 transition-colors">
                <TerminalSquare className="w-4 h-4 text-neutral-300" />
              </div>
              <span className="text-white font-semibold tracking-tight text-base">ATLAS</span>
            </Link>
            
            <div className="hidden md:flex items-center gap-6 text-sm text-neutral-400 font-medium">
              <Link href="/" className="text-white">الرئيسية</Link>
              <Link href="/transfers" className="hover:text-neutral-200 transition-colors">التحويلات و SAGA</Link>
              <Link href="/ledger" className="hover:text-neutral-200 transition-colors">دفتر الأستاذ</Link>
              <Link href="/approvals" className="hover:text-neutral-200 transition-colors">طابور الاعتمادات</Link>
              <Link href="/security" className="hover:text-neutral-200 transition-colors">رادار الأمان</Link>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative group hidden sm:block">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
              <input 
                type="text" 
                placeholder="بحث (Ctrl+K)" 
                className="bg-neutral-900 border border-neutral-800 rounded-lg py-1.5 pr-9 pl-3 text-sm focus:outline-none focus:border-neutral-600 focus:ring-1 focus:ring-neutral-600 transition-all w-60 text-neutral-200 placeholder:text-neutral-600 text-right"
              />
            </div>
            <button className="p-1.5 text-neutral-400 hover:text-white transition-colors" title="التنبيهات">
              <Bell className="w-4 h-4" />
            </button>
            <div className="w-8 h-8 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-xs font-mono font-medium text-white shadow-sm">
              SK
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        
        {/* Header Section */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-white tracking-tight mb-1">نظرة عامة</h1>
            <p className="text-sm text-neutral-400 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>تمت مطابقة الأرصدة بنجاح (Zero Drift Audit: Passed)</span>
            </p>
          </div>
          <div className="flex gap-3">
            <button className="px-4 py-2 text-sm font-medium bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-neutral-200 rounded-lg transition-colors">
              تصدير التقرير
            </button>
            <Link 
              href="/transfers"
              className="px-4 py-2 text-sm font-medium bg-white text-black hover:bg-neutral-200 rounded-lg transition-colors font-medium shadow-sm"
            >
              تحويل جديد
            </Link>
          </div>
        </header>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-[#111111] border border-neutral-800/80 rounded-xl p-6 shadow-sm">
            <p className="text-sm text-neutral-500 mb-2 font-medium">إجمالي السيولة (Accounting Balance)</p>
            <h2 className="text-3xl font-semibold text-white dir-ltr text-right mb-2 font-mono tracking-tight">
              {formatCurrency(data.totalBalance)}
            </h2>
            <div className="flex items-center gap-2 text-xs">
              <span className="flex items-center text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded font-mono font-medium">
                <ArrowUpRight className="w-3 h-3 ml-0.5" /> 2.4%
              </span>
              <span className="text-neutral-500">مقارنة بالشهر الماضي</span>
            </div>
          </div>

          <div className="bg-[#111111] border border-neutral-800/80 rounded-xl p-6 shadow-sm">
            <p className="text-sm text-neutral-500 mb-2 font-medium">العمليات الناجحة (اليوم)</p>
            <h2 className="text-3xl font-semibold text-white mb-2 font-mono tracking-tight">1,842</h2>
            <p className="text-xs text-neutral-500">100% نسبة نجاح المعالجة عبر Outbox Relay</p>
          </div>

          <div className="bg-[#111111] border border-neutral-800/80 rounded-xl p-6 shadow-sm">
            <p className="text-sm text-neutral-500 mb-2 font-medium">العمليات المرفوضة (أمان)</p>
            <h2 className="text-3xl font-semibold text-white mb-2 font-mono tracking-tight">{data.failedTransactions}</h2>
            <p className="text-xs text-neutral-500">تم صدها بواسطة Idempotency Engine & Velocity Check</p>
          </div>
        </div>

        {/* Chart & Table Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Chart */}
          <div className="lg:col-span-2 bg-[#111111] border border-neutral-800/80 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-sm font-medium text-white">تحليل التدفق النقدي</h3>
                <p className="text-xs text-neutral-500 mt-0.5">معدل تغير الرصيد اللحظي بالسنتات</p>
              </div>
              <select className="bg-neutral-900 border border-neutral-800 text-xs rounded-md px-2.5 py-1 outline-none text-neutral-300 font-mono">
                <option>اليوم</option>
                <option>آخر 7 أيام</option>
              </select>
            </div>
            
            <div className="h-64 w-full dir-ltr">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ffffff" stopOpacity={0.12}/>
                      <stop offset="95%" stopColor="#ffffff" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="time" stroke="#404040" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#404040" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val/1000}k`} width={45} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#171717', borderColor: '#262626', borderRadius: '8px', fontSize: '12px' }}
                    itemStyle={{ color: '#fff', fontFamily: 'monospace' }}
                  />
                  <Area type="monotone" dataKey="value" stroke="#ffffff" strokeWidth={2} fill="url(#colorVal)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-[#111111] border border-neutral-800/80 rounded-xl p-6 flex flex-col shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-medium text-white">أحدث القيود المحاسبية</h3>
              <span className="text-[10px] font-mono text-neutral-500 bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800">ACID DUAL-ENTRY</span>
            </div>

            <div className="flex-1 space-y-4">
              {data.recentActivity.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between group cursor-pointer p-2 rounded-lg hover:bg-neutral-900/60 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      tx.amount > 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-neutral-800 text-neutral-400'
                    }`}>
                      {tx.amount > 0 ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white group-hover:text-neutral-300 transition-colors">
                        {tx.type}
                      </p>
                      <p className="text-xs font-mono text-neutral-500">{tx.id}</p>
                    </div>
                  </div>
                  <div className="text-left dir-ltr">
                    <p className={`text-sm font-medium font-mono ${tx.status === 'REVERSED' ? 'text-neutral-500 line-through' : 'text-white'}`}>
                      {formatCurrency(tx.amount)}
                    </p>
                    <p className="text-[10px] text-neutral-500 font-mono">
                      {new Date(tx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <Link 
              href="/ledger"
              className="w-full mt-6 py-2.5 text-xs font-medium text-neutral-400 hover:text-white border border-neutral-800 hover:bg-neutral-800 rounded-lg transition-colors text-center font-mono block"
            >
              عرض كل السجلات (View All Ledger Entries)
            </Link>
          </div>
          
        </div>
      </main>
    </div>
  );
}
