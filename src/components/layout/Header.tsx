'use client';

import React from 'react';
import { Search, Bell, Building2, ExternalLink, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export function Header() {
  const [orgName, setOrgName] = React.useState('Acme Global Corp');

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('crm_user');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed?.organization?.name) {
            setOrgName(parsed.organization.name);
          }
        } catch {
          // ignore
        }
      }
    }
  }, []);

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between flex-shrink-0">
      {/* Search Bar */}
      <div className="flex items-center gap-4 w-96">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search conversations, contacts or templates..."
            className="w-full pl-9 pr-4 py-1.5 bg-slate-100/80 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
          />
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-4">
        {/* Organization Switcher */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700">
          <Building2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>{orgName}</span>
          <span className="ml-1 px-1.5 py-0.2 rounded text-[10px] bg-emerald-100 text-emerald-700 font-bold">
            Owner
          </span>
        </div>

        {/* Quick Link to WhatsApp Setup Wizard */}
        <Link
          href="/settings/whatsapp"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 text-xs font-semibold transition"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Meta API Setup</span>
        </Link>

        <button className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition relative">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full"></span>
        </button>
      </div>
    </header>
  );
}
