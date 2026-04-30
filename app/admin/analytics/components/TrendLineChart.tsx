'use client';

import ReactECharts from 'echarts-for-react';
import type { PageView } from '../types/analytics';

interface TrendLineChartProps {
  data: PageView[];
}

export function TrendLineChart({ data }: TrendLineChartProps) {
  // Sort data by date ascending for proper line chart display
  const sortedData = [...data].sort((a, b) =>
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(30, 41, 59, 0.95)',
      borderColor: 'rgba(71, 85, 105, 0.5)',
      textStyle: {
        color: '#f1f5f9',
        fontSize: 12,
      },
      formatter: (params: any) => {
        const item = params[0];
        return `<div style="font-weight: 600; margin-bottom: 4px;">${item.name}</div><div style="color: #94a3b8;">访问量: <span style="color: #60a5fa; font-weight: 600;">${item.value.toLocaleString()}</span></div>`;
      },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '8%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: sortedData.map(d => d.date),
      boundaryGap: false,
      axisLine: {
        lineStyle: {
          color: '#334155',
        },
      },
      axisLabel: {
        color: '#94a3b8',
        fontSize: 11,
        formatter: (value: string) => {
          const date = new Date(value);
          return `${date.getMonth() + 1}/${date.getDate()}`;
        },
      },
      axisTick: {
        show: false,
      },
    },
    yAxis: {
      type: 'value',
      axisLine: {
        show: false,
      },
      axisLabel: {
        color: '#94a3b8',
        fontSize: 11,
      },
      splitLine: {
        lineStyle: {
          color: 'rgba(71, 85, 105, 0.3)',
          type: 'dashed',
        },
      },
    },
    series: [
      {
        name: '访问量',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        data: sortedData.map(d => d.views),
        lineStyle: {
          color: '#3b82f6',
          width: 3,
        },
        itemStyle: {
          color: '#3b82f6',
          borderWidth: 2,
          borderColor: '#1e293b',
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(59, 130, 246, 0.4)' },
              { offset: 1, color: 'rgba(59, 130, 246, 0.02)' },
            ],
          },
        },
      },
    ],
  };

  return (
    <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/30">
      <h3 className="text-lg font-semibold text-white mb-4">访问趋势</h3>
      {data.length > 0 ? (
        <ReactECharts option={option} style={{ height: '280px' }} />
      ) : (
        <div className="h-[280px] flex items-center justify-center text-slate-500">
          暂无数据
        </div>
      )}
    </div>
  );
}