"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  Check, X, ShieldAlert, Clock, Eye, AlertCircle,
  TerminalSquare, ShieldCheck, ArrowRightLeft, Lock
} from "lucide-react";

const pendingRequests = [
  { id: "REQ-9921", maker: "أحمد محمود (MAKER)", amount: "$45,000.00", dest: "WLT-402", time: "منذ 10 دقائق", risk: "HIGH", status: "PENDING" },
  { id: "REQ-9922", maker: "سارة خالد (MAKER)", amount: "$1,250.00", dest: "WLT-109", time: "منذ 45 دقيقة", risk: "LOW", status: "PENDING" },
  { id: "REQ-9923", maker: "طارق منصور (MAKER)", amount: "$18,420.00", dest: "WLT-881", time: "منذ ساعتين", risk: "MED", status: "PENDING" },
];

export default function ApprovalsQueue() {
  const [requests, setRequests] = useState(pendingRequests);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleAction = (id: string, action: 'APPROVE' | 'REJECT') => {
    setProcessingId(id);
    setTimeout(() => {
      setRequests(requests.filter(req => req.id !== id));
      setProcessingId(null);
    }, 900);
  };

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
                <span className="bg-amber-500/10 text-amber-400 text-[10px] font-mono px-2 py-0.5 rounded border border-amber-500/20">CHECKER</span>
              </div>
              <p className="text-xs text-slate-400 font-mono tracking-wider">FOUR-EYES COMPLIANCE CONSOLE</p>
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
              className="px-3 py-1.5 rounded-md text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors"
            >
              Ledger & Drift
            </Link>
            <Link 
              href="/approvals" 
              className="px-3 py-1.5 rounded-md text-xs font-medium text-white bg-blue-600/20 border border-blue-500/30 font-mono"
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
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-600 to-orange-500 flex items-center justify-center text-white font-bold text-sm border border-amber-400/40 shadow-inner">
              MB
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-white">محمد بنّا</p>
              <p className="text-xs text-amber-400 font-mono font-medium">Compliance Officer (CHECKER)</p>
            </div>
          </div>
        </div>
      </header>

      {/* المحتوى الرئيسي */}
      <main className="flex-1 p-8 flex flex-col gap-6">
        
        <div className="bg-fintech-card border border-fintech-border rounded-xl p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-xl">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <ShieldAlert className="text-amber-500 w-6 h-6" />
              طابور الاعتمادات المالية (Maker-Checker Queue)
            </h1>
            <p className="text-sm text-slate-400 mt-1 font-mono">
              Enforcing the Four-Eyes Principle: Dual Authorization Required for Large Minor-Unit Debits
            </p>
          </div>
          <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 px-4 py-2 rounded-lg text-sm font-mono flex items-center gap-2.5">
            <Clock className="w-4 h-4 animate-spin text-amber-500" /> 
            <span className="font-bold">{requests.length} Pending Authorizations</span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {requests.length === 0 ? (
            <div className="bg-fintech-card border border-fintech-border rounded-xl p-16 text-center text-slate-400 font-mono flex flex-col items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                <Check className="w-6 h-6" />
              </div>
              <p className="text-base text-white font-sans font-semibold">لا توجد طلبات معلقة للاعتماد</p>
              <p className="text-xs text-slate-500">All high-value transfer requests have been verified and processed.</p>
            </div>
          ) : (
            requests.map((req) => (
              <div 
                key={req.id} 
                className="bg-fintech-card border border-fintech-border rounded-xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 transition-all hover:border-slate-700 shadow-lg"
              >
                <div className="flex-1 w-full grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">رقم الطلب (Request ID)</p>
                    <p className="text-sm font-mono text-white dir-ltr text-right md:text-left font-semibold">{req.id}</p>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">{req.time}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">المنشئ (Maker)</p>
                    <p className="text-sm text-slate-200 font-medium">{req.maker}</p>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">Dest: {req.dest}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">المبلغ المطلوب (Minor Units)</p>
                    <p className="text-base font-mono text-fintech-accent dir-ltr text-right md:text-left font-bold">{req.amount}</p>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">Escrow Reserved</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">مستوى المخاطرة (Risk Score)</p>
                    <span className={`inline-block text-[11px] font-mono px-2.5 py-1 rounded font-bold ${
                      req.risk === 'HIGH' 
                        ? 'bg-red-500/15 text-red-400 border border-red-500/30' 
                        : req.risk === 'MED'
                        ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                        : 'bg-fintech-success/15 text-fintech-success border border-fintech-success/30'
                    }`}>
                      {req.risk}_RISK
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto border-t md:border-t-0 md:border-r border-fintech-border pt-4 md:pt-0 md:pr-6">
                  <button 
                    className="p-2.5 text-slate-400 hover:text-white bg-fintech-bg border border-fintech-border rounded-lg transition-colors" 
                    title="معاينة تفاصيل العملية"
                  >
                    <Eye className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => handleAction(req.id, 'REJECT')}
                    disabled={processingId === req.id}
                    className="flex-1 md:flex-none px-5 py-2.5 text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg text-xs font-mono font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <X className="w-4 h-4" /> 
                    <span>{processingId === req.id ? "REJECTING..." : "رفض (REJECT)"}</span>
                  </button>
                  <button 
                    onClick={() => handleAction(req.id, 'APPROVE')}
                    disabled={processingId === req.id}
                    className="flex-1 md:flex-none px-5 py-2.5 text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-lg text-xs font-mono font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 shadow-[0_0_15px_rgba(16,185,129,0.15)]"
                  >
                    <Check className="w-4 h-4" /> 
                    <span>{processingId === req.id ? "COMMITTING..." : "اعتماد (AUTHORIZE)"}</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
