'use client';

import { RefreshCw } from 'lucide-react';

interface StatsCardsProps {
  totalViews: number;
  uniqueVisitors: number;
  avgDailyViews: number;
  lastUpdated: Date | null;
  onRefresh: () => void;
}

export function StatsCards({ totalViews, uniqueVisitors, avgDailyViews, lastUpdated, onRefresh }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {/* Total Views Card */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 shadow-xl border border-slate-700/50">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-slate-400 mb-1 font-medium">总访问量</p>
            <p className="text-4xl font-bold text-white tracking-tight">
              {totalViews.toLocaleString()}
            </p>
            <p className="text-xs text-slate-500 mt-2">次页面浏览</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
            <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Unique Visitors Card */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 shadow-xl border border-slate-700/50">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-slate-400 mb-1 font-medium">独立访客</p>
            <p className="text-4xl font-bold text-white tracking-tight">
              {uniqueVisitors.toLocaleString()}
            </p>
            <p className="text-xs text-slate-500 mt-2">不重复的访客数</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
            <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Average Daily Views Card */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 shadow-xl border border-slate-700/50">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-slate-400 mb-1 font-medium">日均访问</p>
            <p className="text-4xl font-bold text-white tracking-tight">
              {avgDailyViews.toLocaleString()}
            </p>
            <p className="text-xs text-slate-500 mt-2">每天平均访问次数</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
            <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Refresh Bar */}
      <div className="md:col-span-3 flex items-center justify-between bg-slate-800/50 rounded-xl px-4 py-3 border border-slate-700/30">
        <div className="flex items-center gap-2">
          <RefreshCw className="w-4 h-4 text-slate-500" />
          <span className="text-sm text-slate-400">
            {lastUpdated
              ? `最后更新: ${lastUpdated.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`
              : '正在加载...'}
          </span>
        </div>
        <button
          onClick={onRefresh}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          刷新数据
        </button>
      </div>
    </div>
  );
}