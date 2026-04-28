'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { AdminSidebar } from '../../components/AdminSidebar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<{ name: string; email: string } | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    console.log('[AdminLayout] Initial render, pathname:', pathname);
    try {
      const stored = localStorage.getItem('admin_user');
      console.log('[AdminLayout] localStorage admin_user:', stored);
      if (stored && stored !== 'null' && stored !== 'undefined') {
        const parsed = JSON.parse(stored);
        console.log('[AdminLayout] parsed user:', parsed);
        if (parsed && typeof parsed === 'object' && parsed.name) {
          setUser(parsed);
        }
      }
    } catch (error) {
      console.error('Failed to load admin user:', error);
      localStorage.removeItem('admin_user');
    } finally {
      console.log('[AdminLayout] Setting loading to false');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    console.log('[AdminLayout] Auth check - loading:', loading, 'user:', user, 'isLoginPage:', isLoginPage);
    if (!loading && !user && !isLoginPage) {
      console.log('[AdminLayout] Redirecting to login');
      router.push('/admin/login');
    }
  }, [loading, user, router, isLoginPage]);

  const handleLogout = () => {
    localStorage.removeItem('admin_user');
    router.push('/admin/login');
  };

  console.log('[AdminLayout] Rendering - loading:', loading, 'user:', user, 'isLoginPage:', isLoginPage);

  if (loading) {
    console.log('[AdminLayout] Rendering spinner (loading=true)');
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900">
        <div className="animate-spin w-8 h-8 border-4 border-[#0066ff] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user && !isLoginPage) {
    console.log('[AdminLayout] Rendering spinner (no user, not login page)');
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900">
        <div className="animate-spin w-8 h-8 border-4 border-[#0066ff] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user && isLoginPage) {
    console.log('[AdminLayout] Rendering login page (children)');
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900">
      <AdminSidebar user={user} onLogout={handleLogout} />
      <main className="ml-60 min-h-screen">{children}</main>
    </div>
  );
}
