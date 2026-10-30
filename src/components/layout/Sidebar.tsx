'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  MessageSquare,
  Users,
  FileCode2,
  Send,
  Settings,
  ShieldCheck,
  Activity,
  Terminal,
  LogOut,
  Sparkles,
} from 'lucide-react';

export function Sidebar() {
  const pathname = usePathname();
  const [user, setUser] = React.useState<{ name: string; email: string; organization?: { name: string } } | null>(null);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('crm_user');
      if (stored) {
        try {
          setUser(JSON.parse(stored));
        } catch {
          // ignore
        }
      }
    }
  }, []);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Inbox', href: '/inbox', icon: MessageSquare, badge: 'Live' },
    { name: 'Contacts', href: '/contacts', icon: Users },
    { name: 'Templates', href: '/templates', icon: FileCode2 },
    { name: 'Campaigns', href: '/campaigns', icon: Send },
  ];

  const settingsSub = [
    { name: 'WhatsApp Setup', href: '/settings/whatsapp', icon: ShieldCheck },
    { name: 'Webhook Diagnostics', href: '/settings/webhooks', icon: Activity },
    { name: 'API Logs', href: '/settings/api-logs', icon: Terminal },
    { name: 'Users & Roles', href: '/settings/users', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col flex-shrink-0 border-r border-slate-800">
      {/* Brand Header */}
      <div className="h-16 px-6 flex items-center gap-3 border-b border-slate-800/80">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
          <MessageSquare className="w-5 h-5 fill-current" />
        </div>
        <div>
          <h1 className="font-bold text-white text-base leading-tight tracking-tight">
            WhatsApp Connect
          </h1>
          <p className="text-xs text-slate-400 font-medium">Multi-Tenant SaaS</p>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        <div>
          <div className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Main Menu
          </div>
          <nav className="space-y-1">
            {navigation.map(item => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-emerald-600/15 text-emerald-400 border border-emerald-500/20 shadow-sm'
                      : 'hover:bg-slate-800/70 hover:text-white text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                    <span>{item.name}</span>
                  </div>
                  {item.badge && (
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        <div>
          <div className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Configuration
          </div>
          <nav className="space-y-1">
            {settingsSub.map(item => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-3.5 py-2 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-slate-800 text-white font-semibold'
                      : 'hover:bg-slate-800/50 hover:text-white text-slate-400'
                  }`}
                >
                  <Icon className="w-4 h-4 text-slate-400" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Connection Status & Dev Mode Footer */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40">
        <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50 mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-slate-200">Meta API Status</span>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </div>
          <p className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
            <Sparkles className="w-3 h-3 inline" />
            Mock Sandbox Active
          </p>
        </div>

        <div className="flex items-center justify-between pt-1 text-slate-400 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-white text-xs uppercase">
              {user?.name ? user.name.substring(0, 2) : 'AU'}
            </div>
            <div>
              <p className="font-medium text-slate-200 text-xs leading-none">
                {user?.name || 'Avit User'}
              </p>
              <p className="text-[10px] text-slate-400">
                {user?.organization?.name || 'GrowNoww'}
              </p>
            </div>
          </div>
          <Link
            href="/login"
            onClick={() => {
              if (typeof window !== 'undefined') localStorage.removeItem('crm_user');
            }}
            className="hover:text-white p-1"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </aside>
  );
}
