'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { AdminSidebar } from '../../components/AdminSidebar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [loading, setLoading] = useState(true);

  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    const stored = localStorage.getItem('admin_user');
    if (stored) {
      setUser(JSON.parse(stored));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!loading && !user && !isLoginPage) {
      router.push('/admin/login');
    }
  }, [loading, user, router, isLoginPage]);

  const handleLogout = () => {
    localStorage.removeItem('admin_user');
    router.push('/admin/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900">
        <div className="animate-spin w-8 h-8 border-4 border-[#0066ff] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user && !isLoginPage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900">
        <div className="animate-spin w-8 h-8 border-4 border-[#0066ff] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user && isLoginPage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900">
      <AdminSidebar user={user} onLogout={handleLogout} />
      <main className="ml-60 min-h-screen">{children}</main>
    </div>
  );
}
