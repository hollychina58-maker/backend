'use client';

import { X, Globe, Users, FileText, ShoppingBag, TrendingUp, ExternalLink } from 'lucide-react';
import type { CountryDetail } from '../types/analytics';

interface CountryDetailModalProps {
  country: string;
  data: CountryDetail | null;
  loading: boolean;
  onClose: () => void;
}

export function CountryDetailModal({ country, data, loading, onClose }: CountryDetailModalProps) {
  if (!country) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-slate-800 rounded-2xl border border-slate-700/50 w-full max-w-2xl mx-4 max-h-[85vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            <Globe className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-semibold text-white">{country}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(85vh-72px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
            </div>
          ) : data ? (
            <div className="space-y-6">
              {/* Summary Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4 text-emerald-400" />
                    <span className="text-sm text-slate-400">独立访客</span>
                  </div>
                  <p className="text-2xl font-bold text-white">{data.uniqueVisitors.toLocaleString()}</p>
                </div>
                <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/30">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4 text-blue-400" />
                    <span className="text-sm text-slate-400">总访问量</span>
                  </div>
                  <p className="text-2xl font-bold text-white">{data.totalViews.toLocaleString()}</p>
                </div>
              </div>

              {/* Top Pages */}
              <div>
                <h3 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-400" />
                  热门页面
                </h3>
                {data.topPages.length > 0 ? (
                  <div className="space-y-2">
                    {data.topPages.slice(0, 5).map((page, idx) => (
                      <div key={page.page_url} className="flex items-center justify-between p-3 bg-slate-900/30 rounded-lg border border-slate-700/20">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-xs text-slate-500 w-5">{idx + 1}</span>
                          <span className="text-sm text-slate-300 truncate">{page.page_url}</span>
                        </div>
                        <span className="text-sm text-blue-400 font-medium ml-4">{page.views.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 text-center py-4">暂无数据</p>
                )}
              </div>

              {/* Top Products */}
              <div>
                <h3 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-slate-400" />
                  热门产品
                </h3>
                {data.topProducts.length > 0 ? (
                  <div className="space-y-2">
                    {data.topProducts.slice(0, 5).map((product) => (
                      <div key={product.product_id} className="flex items-center justify-between p-3 bg-slate-900/30 rounded-lg border border-slate-700/20">
                        <span className="text-sm text-slate-300">{product.product_id}</span>
                        <span className="text-sm text-purple-400 font-medium">{product.clicks.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 text-center py-4">暂无数据</p>
                )}
              </div>

              {/* Referrers */}
              <div>
                <h3 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                  <ExternalLink className="w-4 h-4 text-slate-400" />
                  来源分布
                </h3>
                {data.referrers.length > 0 ? (
                  <div className="space-y-2">
                    {data.referrers.slice(0, 5).map((ref) => (
                      <div key={ref.referrer} className="flex items-center justify-between p-3 bg-slate-900/30 rounded-lg border border-slate-700/20">
                        <span className="text-sm text-slate-300 truncate max-w-[200px]">{ref.referrer || '直接访问'}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-slate-400">{ref.percentage.toFixed(1)}%</span>
                          <span className="text-sm text-amber-400 font-medium">{ref.visits.toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 text-center py-4">暂无数据</p>
                )}
              </div>

              {/* Views Trend */}
              <div>
                <h3 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-slate-400" />
                  访问趋势
                </h3>
                {data.viewsByDay.length > 0 ? (
                  <div className="grid grid-cols-7 gap-1">
                    {data.viewsByDay.slice(-14).map((day, idx) => {
                      const maxViews = Math.max(...data.viewsByDay.map(d => d.views));
                      const height = maxViews > 0 ? Math.max(20, (day.views / maxViews) * 60) : 4;
                      return (
                        <div key={idx} className="flex flex-col items-center gap-1">
                          <div
                            className="w-full bg-blue-500/60 rounded-sm transition-all hover:bg-blue-400"
                            style={{ height: `${height}px` }}
                            title={`${day.date}: ${day.views}`}
                          />
                          <span className="text-xs text-slate-500">{day.date.slice(5)}</span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 text-center py-4">暂无数据</p>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500">无法加载数据</div>
          )}
        </div>
      </div>
    </div>
  );
}
