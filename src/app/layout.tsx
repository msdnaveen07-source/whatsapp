import type { Metadata } from 'next';
import './globals.css';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';

export const metadata: Metadata = {
  title: 'WhatsApp Connect CRM | Multi-Tenant Meta Cloud API SaaS',
  description: 'Production-ready WhatsApp CRM and 2-way messaging platform built with official Meta WhatsApp Cloud API',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="h-screen flex overflow-hidden bg-slate-50 text-slate-900">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto bg-slate-50">{children}</main>
        </div>
      </body>
    </html>
  );
}
