'use client';

import ReactECharts from 'echarts-for-react';
import type { ReferrerStats } from '../types/analytics';

interface ReferrerChartProps {
  data: ReferrerStats[];
}

const REFERRER_COLORS: Record<string, string> = {
  'direct': '#3b82f6',   // Blue
  'search': '#10b981',    // Green
  'social': '#8b5cf6',    // Purple
  'referral': '#f59e0b',  // Amber
  'unknown': '#64748b',   // Slate
};

function categorizeReferrer(referrer: string): { category: string; color: string } {
  const ref = referrer.toLowerCase();

  if (!ref || ref === '-' || ref === 'direct' || ref === '(direct)') {
    return { category: '直接访问', color: REFERRER_COLORS['direct'] };
  }

  const searchEngines = ['google', 'bing', 'yahoo', 'baidu', 'yandex', 'duckduckgo'];
  if (searchEngines.some(engine => ref.includes(engine))) {
    return { category: '搜索引擎', color: REFERRER_COLORS['search'] };
  }

  const socialPlatforms = ['facebook', 'twitter', 'linkedin', 'instagram', 'youtube', 'tiktok', 'whatsapp', 'telegram'];
  if (socialPlatforms.some(platform => ref.includes(platform))) {
    return { category: '社交媒体', color: REFERRER_COLORS['social'] };
  }

  return { category: '外链跳转', color: REFERRER_COLORS['referral'] };
}

export function ReferrerChart({ data }: ReferrerChartProps) {
  // Categorize and aggregate referrers
  const categoryMap = new Map<string, { visits: number; color: string }>();

  for (const item of data) {
    const { category, color } = categorizeReferrer(item.referrer);
    const existing = categoryMap.get(category);
    if (existing) {
      existing.visits += item.visits;
    } else {
      categoryMap.set(category, { visits: item.visits, color });
    }
  }

  const chartData = Array.from(categoryMap.entries()).map(([name, value]) => ({
    name,
    value: value.visits,
    itemStyle: { color: value.color },
  }));

  const totalVisits = chartData.reduce((sum, item) => sum + item.value, 0);

  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(30, 41, 59, 0.95)',
      borderColor: 'rgba(71, 85, 105, 0.5)',
      textStyle: {
        color: '#f1f5f9',
        fontSize: 12,
      },
      formatter: (params: any) => {
        const percentage = ((params.value / totalVisits) * 100).toFixed(1);
        return `<div style="font-weight: 600; margin-bottom: 4px;">${params.name}</div><div style="color: #94a3b8;">访问量: <span style="color: ${params.color}; font-weight: 600;">${params.value.toLocaleString()}</span> (${percentage}%)</div>`;
      },
    },
    legend: {
      orient: 'vertical',
      right: '5%',
      top: 'center',
      textStyle: {
        color: '#94a3b8',
        fontSize: 12,
      },
      itemWidth: 12,
      itemHeight: 12,
      itemGap: 16,
    },
    series: [
      {
        name: '来源分布',
        type: 'pie',
        radius: ['45%', '75%'],
        center: ['35%', '50%'],
        avoidLabelOverlap: true,
        itemStyle: {
          borderRadius: 6,
          borderColor: '#0f172a',
          borderWidth: 2,
        },
        label: {
          show: false,
        },
        emphasis: {
          label: {
            show: false,
          },
          itemStyle: {
            shadowBlur: 20,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)',
          },
        },
        labelLine: {
          show: false,
        },
        data: chartData,
      },
    ],
  };

  return (
    <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/30">
      <h3 className="text-lg font-semibold text-white mb-4">流量来源</h3>
      {data.length > 0 ? (
        <>
          <ReactECharts option={option} style={{ height: '220px' }} />
          <div className="mt-4 flex flex-wrap gap-4 justify-center">
            {chartData.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.itemStyle.color }}
                />
                <span className="text-sm text-slate-400">
                  {item.name}: <span className="text-white font-medium">{item.value.toLocaleString()}</span>
                </span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="h-[220px] flex items-center justify-center text-slate-500">
          暂无数据
        </div>
      )}
    </div>
  );
}