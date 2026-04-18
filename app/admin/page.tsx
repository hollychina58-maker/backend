'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AdminHeader } from '../../components/AdminHeader';
import { Button } from '../../components/Button';

interface Stats {
  totalProducts: number;
  publishedProducts: number;
  draftProducts: number;
  totalPosts: number;
  publishedPosts: number;
  draftPosts: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({
    totalProducts: 0,
    publishedProducts: 0,
    draftProducts: 0,
    totalPosts: 0,
    publishedPosts: 0,
    draftPosts: 0,
  });

  useEffect(() => {
    async function fetchStats() {
      try {
        const [productsRes] = await Promise.all([
          fetch('/api/products'),
        ]);

        const productsData = await productsRes.json();
        const products = productsData.data || [];

        setStats({
          totalProducts: products.length,
          publishedProducts: products.filter((p: { published: boolean }) => p.published).length,
          draftProducts: products.filter((p: { published: boolean }) => !p.published).length,
          totalPosts: 0,
          publishedPosts: 0,
          draftPosts: 0,
        });
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      }
    }

    fetchStats();
  }, []);

  return (
    <>
      <AdminHeader title="仪表盘" />
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="产品总数"
            value={stats.totalProducts}
            icon={
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            }
            color="blue"
          />
          <StatCard
            title="已发布"
            value={stats.publishedProducts}
            icon={
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            color="emerald"
          />
          <StatCard
            title="草稿"
            value={stats.draftProducts}
            icon={
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            }
            color="amber"
          />
          <StatCard
            title="文章总数"
            value={stats.totalPosts}
            icon={
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
            }
            color="purple"
          />
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">快捷操作</h2>
          <div className="flex flex-wrap gap-4">
            <Link href="/admin/products">
              <Button leftIcon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              }>
                新增产品
              </Button>
            </Link>
            <Link href="/admin/blog">
              <Button variant="secondary" leftIcon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              }>
                新增文章
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

function StatCard({ title, value, icon, color }: {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: 'blue' | 'emerald' | 'amber' | 'purple';
}) {
  const colorClasses = {
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    emerald: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
    amber: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
    purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorClasses[color]}`}>
          {icon}
        </div>
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400">{title}</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
        </div>
      </div>
    </div>
  );
}
