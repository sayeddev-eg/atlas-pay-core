"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  Play, ShieldAlert, GitCommit, Database, 
  Terminal, CheckCircle2, AlertTriangle, ArrowRight,
  TerminalSquare, Bell, Search, RefreshCw, Layers
} from "lucide-react";

export default function TransferEngine() {
  const [amount, setAmount] = useState("2500.00");
  const [idempotencyKey, setIdempotencyKey] = useState("idem_9841xD_sayed");
  const [activeStep, setActiveStep] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Simulation Logic: To demonstrate architectural resilience visually
  const runSimulation = (scenario: "NORMAL" | "DOUBLE_PRESS" | "GATEWAY_FAIL") => {
    if (isProcessing) return;
    setIsProcessing(true);
    setLogs(["[SYSTEM] Initiating orchestration..."]);
    setActiveStep(1);

    setTimeout(() => {
      setLogs(prev => [...prev, `> REDIS: SETNX idempotency:tenant:${idempotencyKey}`]);
      
      if (scenario === "DOUBLE_PRESS") {
        setLogs(prev => [
          ...prev, 
          `[!] REDIS: Key exists. Status=PROCESSING. Lock acquisition rejected.`, 
          `[!] HTTP 409 Conflict: Idempotency collision prevented. Double-spending blocked.`
        ]);
        setActiveStep(0);
        setIsProcessing(false);
        return;
      }

      setActiveStep(2);
      setLogs(prev => [
        ...prev, 
        `> POSTGRES: BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE;`,
        `> POSTGRES: SELECT * FROM wallets WHERE id IN (wlt_src, wlt_dest) ORDER BY id ASC FOR UPDATE; /* Deadlock-free */`
      ]);

      setTimeout(() => {
        if (scenario === "GATEWAY_FAIL") {
          setActiveStep(3);
          setLogs(prev => [
            ...prev, 
            `> EXTERNAL API: Charge attempt to Payment Rail (Stripe/SEPA/SWIFT)...`, 
            `[!] EXTERNAL API: 503 Service Unavailable / Network Timeout.`
          ]);
          
          setTimeout(() => {
            setActiveStep(4);
            setLogs(prev => [
              ...prev, 
              `[SAGA] Executing Compensating Transaction...`, 
              `> POSTGRES: ROLLBACK; Compensating reversal entry created in ledger_entries.`,
              `[SAGA] Wallet balances safely restored. Zero financial leakage.`
            ]);
            setIsProcessing(false);
          }, 1500);
          return;
        }

        // Normal Flow
        setActiveStep(3);
        setLogs(prev => [
          ...prev, 
          `> POSTGRES: INSERT INTO ledger_entries (wallet_id, type: DEBIT, amount: 250000);`,
          `> POSTGRES: INSERT INTO ledger_entries (wallet_id, type: CREDIT, amount: 250000);`,
          `> POSTGRES: INSERT INTO outbox_events (aggregate_id, event_type: TRANSFER_COMPLETED);`,
          `> POSTGRES: COMMIT;`
        ]);

        setTimeout(() => {
          setActiveStep(4);
          setLogs(prev => [
            ...prev, 
            `> RELAY WORKER: Picked up outbox event via FOR UPDATE SKIP LOCKED.`, 
            `> MESSAGE BUS: Kafka/BullMQ published [TRANSFER_COMPLETED] to downstream consumers.`,
            `[SYSTEM] Transfer finalized with zero drift.`
          ]);
          setIsProcessing(false);
        }, 1500);

      }, 1500);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-fintech-bg text-slate-300 font-sans flex flex-col" dir="rtl">
      
      {/* شريط التنقل العلوي المشترك */}
      <header className="h-20 border-b border-fintech-border flex items-center justify-between px-8 bg-fintech-card/60 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-fintech-accent rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.4)] group-hover:scale-105 transition-transform">
              <TerminalSquare className="text-white w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white tracking-tight">ATLAS PAY</h1>
                <span className="bg-blue-500/10 text-blue-400 text-[10px] font-mono px-2 py-0.5 rounded border border-blue-500/20">ORCHESTRATOR</span>
              </div>
              <p className="text-xs text-slate-400 font-mono tracking-wider">SAGA & IDEMPOTENCY CONTROL PLANE</p>
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
              className="px-3 py-1.5 rounded-md text-xs font-medium text-white bg-blue-600/20 border border-blue-500/30 font-mono"
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
      <main className="flex-1 p-8 flex flex-col lg:flex-row gap-8">
        
        {/* لوحة التحكم وإعدادات التحويل (Left Column) */}
        <div className="w-full lg:w-1/3 flex flex-col gap-6">
          <div className="bg-fintech-card border border-fintech-border rounded-xl p-6">
            <h2 className="text-lg font-bold text-white mb-6 border-b border-fintech-border pb-4 flex items-center justify-between">
              <span>إعدادات التحويل (Transfer Config)</span>
              <span className="text-[10px] font-mono bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded border border-blue-500/20">ACID DUAL-ENTRY</span>
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">المحفظة المصدر (Debit Source)</label>
                <select className="w-full bg-fintech-bg border border-fintech-border rounded-md p-2.5 text-sm text-slate-300 font-mono outline-none focus:border-fintech-accent">
                  <option>WLT-901 (الكيان الأساسي USD) - $12,450.00</option>
                  <option>WLT-902 (خزينة العملات الأجنبية AED) - 210,040.00 AED</option>
                  <option>WLT-903 (حساب التسويات USDC) - $312,040.00</option>
                </select>
              </div>
              
              <div>
                <label className="block text-xs text-slate-400 mb-1">الجهة المستقبلة (Credit Destination)</label>
                <select className="w-full bg-fintech-bg border border-fintech-border rounded-md p-2.5 text-sm text-slate-300 font-mono outline-none focus:border-fintech-accent">
                  <option>WLT-402 (حساب تسويات الموردين USD)</option>
                  <option>WLT-405 (محفظة السحوبات اللحظية RTP)</option>
                </select>
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-xs text-slate-400 mb-1">المبلغ (USD)</label>
                  <input 
                    type="text" 
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-fintech-bg border border-fintech-border rounded-md p-2.5 text-sm font-mono text-left dir-ltr text-white outline-none focus:border-fintech-accent font-semibold" 
                  />
                  <p className="text-[10px] text-slate-500 font-mono mt-1">Minor units: 250,000 cents</p>
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-slate-400 mb-1">Idempotency-Key</label>
                  <input 
                    type="text" 
                    value={idempotencyKey}
                    onChange={(e) => setIdempotencyKey(e.target.value)}
                    className="w-full bg-fintech-bg border border-fintech-border rounded-md p-2.5 text-sm font-mono text-left dir-ltr text-slate-300 outline-none focus:border-fintech-accent" 
                  />
                  <p className="text-[10px] text-slate-500 font-mono mt-1">Redis SETNX key</p>
                </div>
              </div>
            </div>
          </div>

          {/* سيناريوهات التنفيذ الهندسية */}
          <div className="bg-fintech-card border border-fintech-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white">محاكاة سيناريوهات الـ Backend</h3>
              <span className="text-[10px] font-mono text-slate-500">INTERACTIVE TEST</span>
            </div>
            
            <div className="space-y-3">
              <button 
                onClick={() => runSimulation("NORMAL")}
                disabled={isProcessing}
                className="w-full flex items-center justify-between p-3.5 rounded-lg border border-fintech-border bg-fintech-bg hover:border-fintech-accent hover:bg-slate-900 transition-all text-right group disabled:opacity-50"
              >
                <div>
                  <p className="text-sm text-white font-medium group-hover:text-blue-400 transition-colors">1. المسار الطبيعي (Happy Path)</p>
                  <p className="text-xs text-slate-500 mt-1 font-mono">ACID + Outbox + Broker Commit</p>
                </div>
                <div className="p-2 bg-blue-500/10 rounded-md border border-blue-500/20 group-hover:scale-110 transition-transform">
                  <Play className="w-4 h-4 text-fintech-accent" />
                </div>
              </button>

              <button 
                onClick={() => runSimulation("DOUBLE_PRESS")}
                disabled={isProcessing}
                className="w-full flex items-center justify-between p-3.5 rounded-lg border border-fintech-border bg-fintech-bg hover:border-amber-500 hover:bg-slate-900 transition-all text-right group disabled:opacity-50"
              >
                <div>
                  <p className="text-sm text-white font-medium group-hover:text-amber-400 transition-colors">2. اختبار الضغط المزدوج (Race Condition)</p>
                  <p className="text-xs text-slate-500 mt-1 font-mono">Simulate Double-Spending attempt</p>
                </div>
                <div className="p-2 bg-amber-500/10 rounded-md border border-amber-500/20 group-hover:scale-110 transition-transform">
                  <ShieldAlert className="w-4 h-4 text-amber-500" />
                </div>
              </button>

              <button 
                onClick={() => runSimulation("GATEWAY_FAIL")}
                disabled={isProcessing}
                className="w-full flex items-center justify-between p-3.5 rounded-lg border border-fintech-border bg-fintech-bg hover:border-red-500 hover:bg-slate-900 transition-all text-right group disabled:opacity-50"
              >
                <div>
                  <p className="text-sm text-white font-medium group-hover:text-red-400 transition-colors">3. فشل بوابة الدفع (SAGA Compensation)</p>
                  <p className="text-xs text-slate-500 mt-1 font-mono">Rollback & automated reversal entry</p>
                </div>
                <div className="p-2 bg-red-500/10 rounded-md border border-red-500/20 group-hover:scale-110 transition-transform">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* مراقب التنفيذ والـ Terminal (Right Column) */}
        <div className="w-full lg:w-2/3 flex flex-col gap-6">
          
          {/* Execution Stepper */}
          <div className="bg-fintech-card border border-fintech-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white">مراقب خطوات التنفيذ (Execution Stepper)</h2>
              <span className="text-xs font-mono text-slate-400">
                Status: {isProcessing ? "PROCESSING..." : activeStep === 4 ? "COMPLETED" : "IDLE"}
              </span>
            </div>
            
            <div className="flex justify-between items-center relative py-2">
              <div className="absolute top-1/2 -translate-y-1/2 right-12 left-12 h-0.5 bg-fintech-border -z-0" />
              
              {[
                { id: 1, label: "Redis Lock", sub: "SETNX Key", icon: Database },
                { id: 2, label: "DB FOR UPDATE", sub: "Pessimistic Lock", icon: GitCommit },
                { id: 3, label: "Ledger + Outbox", sub: "ACID Atomicity", icon: Layers },
                { id: 4, label: "Broker Sync", sub: "SKIP LOCKED", icon: CheckCircle2 }
              ].map((step) => (
                <div key={step.id} className="flex flex-col items-center bg-fintech-card px-3 z-10">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 mb-2 transition-all duration-300 shadow-lg ${
                    activeStep >= step.id 
                      ? "bg-blue-600/20 border-blue-500 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.3)]" 
                      : "bg-fintech-bg border-fintech-border text-slate-500"
                  }`}>
                    <step.icon className="w-5 h-5" />
                  </div>
                  <span className={`text-xs font-mono font-medium ${activeStep >= step.id ? "text-white" : "text-slate-500"}`}>
                    {step.label}
                  </span>
                  <span className="text-[10px] font-mono text-slate-600 mt-0.5">
                    {step.sub}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Live SQL & Redis Trace Terminal */}
          <div className="bg-[#05080F] border border-fintech-border rounded-xl flex-1 flex flex-col overflow-hidden shadow-2xl">
            <div className="bg-[#0A101D] border-b border-fintech-border px-4 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-slate-400" />
                <span className="text-xs text-slate-400 font-mono tracking-wider">SYSTEM TRACE (SQL • REDIS • SAGA LOGS)</span>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>ACTIVE LISTENER</span>
              </div>
            </div>
            
            <div className="p-4 flex-1 overflow-y-auto font-mono text-xs md:text-sm text-green-400/90 dir-ltr text-left leading-relaxed space-y-2 min-h-[320px]">
              {logs.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-600 font-mono py-16 gap-2">
                  <Terminal className="w-8 h-8 text-slate-700" />
                  <p>Waiting for orchestration trigger...</p>
                  <p className="text-xs text-slate-700">Click any scenario on the left to start live backend simulation</p>
                </div>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className={`font-mono ${
                    log.includes('[!]') ? 'text-red-400 font-semibold' : 
                    log.includes('SAGA') ? 'text-amber-400 font-semibold' : 
                    log.includes('POSTGRES') ? 'text-blue-400' : 
                    log.includes('REDIS') ? 'text-purple-400' :
                    log.includes('MESSAGE BUS') || log.includes('RELAY') ? 'text-teal-400' :
                    'text-green-400'
                  }`}>
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
