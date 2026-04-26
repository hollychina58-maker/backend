'use client';

import { useEffect, useState } from 'react';
import { AdminHeader } from '../../../components/AdminHeader';

interface Stats {
  totalViews: number;
  uniqueVisitors: number;
  viewsByDay: { date: string; views: number }[];
  topProducts: { product_id: string; clicks: number }[];
  topCountries: { country: string; views: number }[];
  topPages: { page_url: string; views: number }[];
}

export default function AnalyticsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [days, setDays] = useState('30');

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch(`/api/analytics/stats?days=${days}`);
        const data = await res.json();
        if (data.success) {
          setStats(data.data);
        } else {
          setError(data.error || 'Failed to load stats');
        }
      } catch {
        setError('Failed to load analytics');
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, [days]);

  return (
    <>
      <AdminHeader title="访问统计" />
      <div className="p-6">
        <div className="mb-6 flex items-center gap-4">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
            时间范围:
          </label>
          <select
            value={days}
            onChange={(e) => setDays(e.target.value)}
            className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
          >
            <option value="7">最近7天</option>
            <option value="30">最近30天</option>
            <option value="90">最近90天</option>
          </select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-[#0066ff] border-t-transparent rounded-full" />
          </div>
        ) : error ? (
          <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400">
            {error}
          </div>
        ) : stats ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">总访问量</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">{stats.totalViews.toLocaleString()}</p>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">独立访客</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">{stats.uniqueVisitors.toLocaleString()}</p>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">平均每日访问</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">
                  {Math.round(stats.totalViews / parseInt(days, 10))}
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 mb-6">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">热门产品</h2>
              {stats.topProducts.length > 0 ? (
                <div className="space-y-2">
                  {stats.topProducts.map((product) => (
                    <div key={product.product_id} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-700 last:border-0">
                      <span className="text-slate-700 dark:text-slate-300">{product.product_id}</span>
                      <span className="text-[#0066ff] font-medium">{product.clicks} 次点击</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 dark:text-slate-400">暂无数据</p>
              )}
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 mb-6">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">访客国家分布</h2>
              {stats.topCountries.length > 0 ? (
                <div className="space-y-2">
                  {stats.topCountries.map((country) => (
                    <div key={country.country} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-700 last:border-0">
                      <span className="text-slate-700 dark:text-slate-300">{country.country || 'Unknown'}</span>
                      <span className="text-[#0066ff] font-medium">{country.views} 次访问</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 dark:text-slate-400">暂无数据</p>
              )}
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">热门页面</h2>
              {stats.topPages.length > 0 ? (
                <div className="space-y-2">
                  {stats.topPages.map((page) => (
                    <div key={page.page_url} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-700 last:border-0">
                      <span className="text-slate-700 dark:text-slate-300 truncate max-w-md">{page.page_url}</span>
                      <span className="text-[#0066ff] font-medium ml-4">{page.views} 次访问</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 dark:text-slate-400">暂无数据</p>
              )}
            </div>
          </>
        ) : null}
      </div>
    </>
  );
}