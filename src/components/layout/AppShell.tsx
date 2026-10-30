'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';

const PUBLIC_PATHS = ['/login', '/register', '/forgot-password'];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthChecked, setIsAuthChecked] = useState(false);

  const isPublicPage = PUBLIC_PATHS.includes(pathname);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const user = localStorage.getItem('crm_user');

      if (!user && !isPublicPage) {
        // Not logged in -> Redirect to login page
        router.replace('/login');
      } else if (user && isPublicPage && pathname !== '/forgot-password') {
        // Already logged in and visiting /login or /register -> Redirect to dashboard
        router.replace('/dashboard');
      } else {
        setIsAuthChecked(true);
      }
    }
  }, [pathname, isPublicPage, router]);

  // If public auth page, render without Sidebar and Header
  if (isPublicPage) {
    return <main className="min-h-screen bg-slate-900">{children}</main>;
  }

  // Waiting for authentication check
  if (!isAuthChecked) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Authenticated application shell
  return (
    <div className="h-screen flex overflow-hidden bg-slate-50 text-slate-900">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto bg-slate-50">{children}</main>
      </div>
    </div>
  );
}
