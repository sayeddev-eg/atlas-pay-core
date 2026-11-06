import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ATLAS PAY — Core Banking & Payment Engine',
  description: 'Enterprise FinTech Platform for multi-tenant treasury, double-entry ledger, and real-time reconciliation.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl">
      <body className="bg-[#090D16] text-slate-200 antialiased selection:bg-blue-600 selection:text-white">
        {children}
      </body>
    </html>
  );
}
