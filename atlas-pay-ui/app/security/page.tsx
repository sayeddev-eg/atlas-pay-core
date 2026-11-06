"use client";

import React from "react";
import Link from "next/link";
import { 
  Activity, Shield, Lock, AlertTriangle, 
  TerminalSquare, ShieldCheck, Database, Zap,
  Radio, CheckCircle2, AlertOctagon
} from "lucide-react";

const blockedAttempts = [
  { id: "SEC-001", rule: "Velocity Limit Exceeded", target: "WLT-901", info: "$6,500 attempted in 5 mins (Max: $5,000/hr)", time: "14:22:10" },
  { id: "SEC-002", rule: "Idempotency Collision", target: "TRX-10928", info: "Duplicate key detected: idem_9841xD (HTTP 409)", time: "12:00:46" },
  { id: "SEC-003", rule: "Cross-Tenant Access", target: "API /orgs/acme/wallets", info: "Forbidden tenant mismatch in JWT payload", time: "09:15:02" },
  { id: "SEC-004", rule: "Maker-Checker Breach", target: "TRX-10931", info: "MAKER attempted self-approval of own transfer", time: "08:44:19" },
  { id: "SEC-005", rule: "Deadlock Cycle Detected", target: "SERIALIZABLE LOCK", info: "Pessimistic sort resolved contention", time: "07:11:30" },
];

export default function SecurityRadar() {
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
                <span className="bg-red-500/10 text-red-400 text-[10px] font-mono px-2 py-0.5 rounded border border-red-500/20">FRAUD SHIELD</span>
              </div>
              <p className="text-xs text-slate-400 font-mono tracking-wider">REAL-TIME RISK & VELOCITY RADAR</p>
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
              className="px-3 py-1.5 rounded-md text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors"
            >
              Maker-Checker Queue
            </Link>
            <Link 
              href="/security" 
              className="px-3 py-1.5 rounded-md text-xs font-medium text-white bg-blue-600/20 border border-blue-500/30 font-mono"
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
      <main className="flex-1 p-8 flex flex-col lg:flex-row gap-6">
        
        {/* Rules Column */}
        <div className="w-full lg:w-1/3 flex flex-col gap-6">
          <div className="bg-fintech-card border border-fintech-border rounded-xl p-6 shadow-xl">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-6 border-b border-fintech-border pb-4">
              <Shield className="text-fintech-success w-5 h-5" />
              <span>قواعد الحماية النشطة (Security Guardrails)</span>
            </h2>
            
            <div className="space-y-4">
              <div className="bg-fintech-bg border border-fintech-border p-4 rounded-xl flex items-start gap-4 hover:border-emerald-500/40 transition-colors">
                <div className="mt-1 w-2.5 h-2.5 rounded-full bg-fintech-success animate-pulse shadow-[0_0_10px_#10B981] flex-shrink-0" />
                <div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-white font-mono">Velocity Checker</p>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">SLIDING WINDOW</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    يمنع سحب أكثر من $5,000 في الساعة للمحفظة الواحدة عبر خوارزمية التدفق الزمني في Redis.
                  </p>
                </div>
              </div>

              <div className="bg-fintech-bg border border-fintech-border p-4 rounded-xl flex items-start gap-4 hover:border-emerald-500/40 transition-colors">
                <div className="mt-1 w-2.5 h-2.5 rounded-full bg-fintech-success animate-pulse shadow-[0_0_10px_#10B981] flex-shrink-0" />
                <div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-white font-mono">Strict Idempotency</p>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">ATOMIC SETNX</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    يمنع تنفيذ أي عملية مكررة تحمل نفس الـ Header عبر Redis Lock وقيد قاعدة البيانات الفريد.
                  </p>
                </div>
              </div>

              <div className="bg-fintech-bg border border-fintech-border p-4 rounded-xl flex items-start gap-4 hover:border-emerald-500/40 transition-colors">
                <div className="mt-1 w-2.5 h-2.5 rounded-full bg-fintech-success animate-pulse shadow-[0_0_10px_#10B981] flex-shrink-0" />
                <div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-white font-mono">Tenant Isolation Guard</p>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">CLIENT EXTENSION</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    يعزل البيانات تماماً على مستوى الـ Prisma ORM لمنع أي تسريب بين الشركات والمؤسسات.
                  </p>
                </div>
              </div>

              <div className="bg-fintech-bg border border-fintech-border p-4 rounded-xl flex items-start gap-4 hover:border-emerald-500/40 transition-colors">
                <div className="mt-1 w-2.5 h-2.5 rounded-full bg-fintech-success animate-pulse shadow-[0_0_10px_#10B981] flex-shrink-0" />
                <div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-white font-mono">Zero-Drift Auditor</p>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">MIDNIGHT CRON</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    يدقق توازن الدائن والمدين آلياً عبر كامل سجلات دفتر الأستاذ ويجمد النظام في حال وجود فارق سنت واحد.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Logs Column */}
        <div className="w-full lg:w-2/3 bg-fintech-card border border-fintech-border rounded-xl p-6 flex flex-col shadow-xl">
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-fintech-border">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Activity className="text-red-500 w-5 h-5" />
                <span>سجل العمليات الموقوفة والمحاولات المشبوهة (Blocked Attempts)</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1 font-mono">
                Intercepted in-flight threats and policy violations
              </p>
            </div>
            <span className="text-xs font-mono bg-red-500/10 text-red-400 px-3 py-1 rounded-full border border-red-500/20 flex items-center gap-1.5 font-bold">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              LIVE MONITORING
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3">
            {blockedAttempts.map((log) => (
              <div 
                key={log.id} 
                className="p-4 rounded-xl bg-[#05080F] border border-red-900/30 flex flex-col md:flex-row justify-between md:items-center gap-4 hover:border-red-900/60 transition-all shadow-md"
              >
                <div className="flex items-center gap-4">
                  <div className="bg-red-500/10 p-2.5 rounded-lg border border-red-500/20">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-red-400">{log.rule}</p>
                      <span className="text-[10px] font-mono text-slate-500 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">{log.id}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 font-mono">{log.info}</p>
                  </div>
                </div>
                
                <div className="flex flex-row md:flex-col justify-between md:items-end gap-1 border-t md:border-t-0 border-fintech-border pt-2 md:pt-0">
                  <span className="text-xs font-mono text-blue-400 font-semibold">{log.target}</span>
                  <span className="text-xs font-mono text-slate-500">{log.time}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-fintech-border/70 flex items-center justify-between text-xs font-mono text-slate-500">
            <span>Threat Detection Engine: Active</span>
            <span>Total Blocked Threats: 842</span>
          </div>
        </div>

      </main>
    </div>
  );
}
