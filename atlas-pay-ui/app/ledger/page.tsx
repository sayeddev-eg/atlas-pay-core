"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  BookOpen, CheckCircle, AlertOctagon, 
  ArrowDownUp, Search, RefreshCw, FileText,
  TerminalSquare, ShieldCheck, Download, Filter
} from "lucide-react";

// بيانات تجريبية لمحاكاة دفتر القيود المزدوجة (Double-Entry Ledger)
const ledgerEntries = [
  { id: "LEDG-8921", trxId: "TRX-10928", account: "WLT-901", type: "DEBIT", amount: "-$250.00", balance: "$12,200.00", date: "2026-03-27 12:00:45" },
  { id: "LEDG-8922", trxId: "TRX-10928", account: "WLT-402", type: "CREDIT", amount: "+$250.00", balance: "$250.00", date: "2026-03-27 12:00:45" },
  { id: "LEDG-8923", trxId: "TRX-10929", account: "WLT-901", type: "CREDIT", amount: "+$1,200.00", balance: "$13,400.00", date: "2026-03-27 12:35:10" },
  { id: "LEDG-8924", trxId: "TRX-10930", account: "WLT-402", type: "DEBIT", amount: "-$45.50", balance: "$204.50", date: "2026-03-27 13:05:22" },
  { id: "LEDG-8925", trxId: "TRX-10930", account: "WLT-901", type: "CREDIT", amount: "+$45.50", balance: "$13,445.50", date: "2026-03-27 13:05:22" },
];

export default function LedgerReconciliation() {
  const [isReconciling, setIsReconciling] = useState(false);
  const [driftStatus, setDriftStatus] = useState<"SYNCED" | "DRIFT_DETECTED">("SYNCED");
  const [filterType, setFilterType] = useState<"ALL" | "DEBIT" | "CREDIT">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const runReconciliation = () => {
    setIsReconciling(true);
    setTimeout(() => {
      setIsReconciling(false);
      setDriftStatus("SYNCED");
    }, 1800);
  };

  const filteredEntries = ledgerEntries.filter((entry) => {
    const matchesFilter = filterType === "ALL" || entry.type === filterType;
    const matchesSearch = 
      entry.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.trxId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.account.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-fintech-bg text-slate-300 font-sans flex flex-col" dir="rtl">
      
      {/* شريط التنقل العلوي الموحد */}
      <header className="h-20 border-b border-fintech-border flex items-center justify-between px-8 bg-fintech-card/60 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-fintech-accent rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.4)] group-hover:scale-105 transition-transform">
              <TerminalSquare className="text-white w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white tracking-tight">ATLAS PAY</h1>
                <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-mono px-2 py-0.5 rounded border border-emerald-500/20">AUDIT</span>
              </div>
              <p className="text-xs text-slate-400 font-mono tracking-wider">DOUBLE-ENTRY & RECONCILIATION</p>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-1 border-r border-fintech-border pr-6">
            <Link 
              href="/" 
              className="px-3 py-1.5 rounded-md text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors"
            >
              Overview
            </Link>
            <Link 
              href="/transfers" 
              className="px-3 py-1.5 rounded-md text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors"
            >
              Transfer & SAGA
            </Link>
            <Link 
              href="/ledger" 
              className="px-3 py-1.5 rounded-md text-xs font-medium text-white bg-blue-600/20 border border-blue-500/30 font-mono"
            >
              Ledger & Drift
            </Link>
            <Link 
              href="/approvals" 
              className="px-3 py-1.5 rounded-md text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors"
            >
              Maker-Checker Queue
            </Link>
            <Link 
              href="/security" 
              className="px-3 py-1.5 rounded-md text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors"
            >
              Fraud Radar
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3 border-r border-fintech-border pr-6">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-700 to-indigo-600 flex items-center justify-center text-white font-bold text-sm border border-blue-400/30">
              SK
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-white">سيد الكيلاني</p>
              <p className="text-xs text-fintech-accent font-mono font-medium">Lead Engineer (MAKER)</p>
            </div>
          </div>
        </div>
      </header>

      {/* المحتوى الرئيسي */}
      <main className="flex-1 p-8 flex flex-col gap-6">
        
        {/* رأس الصفحة وأدوات التسوية */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-fintech-card border border-fintech-border rounded-xl p-6 shadow-xl">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <BookOpen className="text-fintech-accent w-6 h-6" />
              دفتر الأستاذ العام والتسويات المالية
            </h1>
            <p className="text-sm text-slate-400 mt-1 font-mono">
              Double-Entry Accounting Ledger & Drift Reconciliation (Zero IEEE-754 Error)
            </p>
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            <div className="bg-[#05080F] border border-fintech-border rounded-lg px-4 py-2 flex items-center gap-3">
              <span className="text-xs text-slate-400">حالة المطابقة (System Drift):</span>
              {driftStatus === "SYNCED" ? (
                <span className="text-sm font-mono text-fintech-success flex items-center gap-1.5 font-bold">
                  <CheckCircle className="w-4 h-4 text-emerald-400" /> ZERO_DRIFT (Balanced)
                </span>
              ) : (
                <span className="text-sm font-mono text-red-500 flex items-center gap-1.5 font-bold">
                  <AlertOctagon className="w-4 h-4 text-red-400" /> OUT_OF_SYNC
                </span>
              )}
            </div>
            
            <button 
              onClick={runReconciliation}
              disabled={isReconciling}
              className="bg-fintech-accent hover:bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 disabled:opacity-50 shadow-[0_0_15px_rgba(59,130,246,0.25)] font-mono"
            >
              <RefreshCw className={`w-4 h-4 ${isReconciling ? "animate-spin" : ""}`} />
              {isReconciling ? "جارِ تدقيق الأرصدة (SQL)..." : "تشغيل تسوية يدوية (Audit)"}
            </button>
          </div>
        </div>

        {/* أدوات البحث والفلترة */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-fintech-card border border-fintech-border rounded-xl p-4">
          <div className="flex items-center gap-3 flex-1 max-w-lg">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="البحث برقم القيد LEDG أو العملية TRX..." 
                className="w-full bg-fintech-bg border border-fintech-border rounded-lg py-2 pr-10 pl-4 text-sm focus:outline-none focus:border-fintech-accent text-right font-mono placeholder:font-sans text-slate-200" 
              />
            </div>
            
            <select 
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="bg-fintech-bg border border-fintech-border rounded-lg px-4 py-2 text-sm text-slate-300 font-mono outline-none focus:border-fintech-accent"
            >
              <option value="ALL">كل القيود (ALL)</option>
              <option value="DEBIT">DEBIT فقط</option>
              <option value="CREDIT">CREDIT فقط</option>
            </select>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-xs font-mono text-slate-500 px-3 py-1 bg-fintech-bg rounded border border-fintech-border/50">
              Showing: {filteredEntries.length} of {ledgerEntries.length} entries
            </div>
            <button className="border border-fintech-border hover:bg-slate-800 text-slate-300 px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 font-mono">
              <FileText className="w-4 h-4 text-slate-400" />
              <span>تصدير CSV</span>
            </button>
          </div>
        </div>

        {/* جدول القيود المحاسبية */}
        <div className="bg-fintech-card border border-fintech-border rounded-xl overflow-hidden flex-1 shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead className="bg-[#0A101D] border-b border-fintech-border text-slate-400 font-mono text-xs">
                <tr>
                  <th className="px-6 py-4 font-semibold">معرف القيد (Ledger ID)</th>
                  <th className="px-6 py-4 font-semibold">معرف العملية (TRX ID)</th>
                  <th className="px-6 py-4 font-semibold">التاريخ والوقت</th>
                  <th className="px-6 py-4 font-semibold">المحفظة (Account)</th>
                  <th className="px-6 py-4 font-semibold">النوع (Type)</th>
                  <th className="px-6 py-4 font-semibold">المبلغ (Amount)</th>
                  <th className="px-6 py-4 font-semibold">الرصيد التراكمي</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-fintech-border font-mono text-xs">
                {filteredEntries.map((entry, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4 text-slate-300 font-medium">{entry.id}</td>
                    <td className="px-6 py-4 text-fintech-accent font-semibold">{entry.trxId}</td>
                    <td className="px-6 py-4 text-slate-500 dir-ltr text-left">{entry.date}</td>
                    <td className="px-6 py-4 text-slate-200">{entry.account}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded text-[10px] font-bold ${
                        entry.type === 'CREDIT' 
                          ? 'bg-fintech-success/15 text-fintech-success border border-fintech-success/30' 
                          : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                      }`}>
                        {entry.type}
                      </span>
                    </td>
                    <td className={`px-6 py-4 font-bold dir-ltr text-left ${
                      entry.type === 'CREDIT' ? 'text-fintech-success' : 'text-amber-400'
                    }`}>
                      {entry.amount}
                    </td>
                    <td className="px-6 py-4 text-white font-medium dir-ltr text-left">{entry.balance}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  );
}
