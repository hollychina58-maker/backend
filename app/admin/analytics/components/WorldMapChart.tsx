'use client';

import { useEffect, useState, useRef } from 'react';
import * as echarts from 'echarts';
import type { CountryStats } from '../types/analytics';

interface WorldMapChartProps {
  data: CountryStats[];
  onCountryClick: (country: string) => void;
}

// Country name mapping to ECharts geo names
const COUNTRY_NAME_MAP: Record<string, string> = {
  'CN': 'China',
  'US': 'United States',
  'DE': 'Germany',
  'FR': 'France',
  'GB': 'United Kingdom',
  'JP': 'Japan',
  'KR': 'South Korea',
  'IN': 'India',
  'BR': 'Brazil',
  'RU': 'Russia',
  'CA': 'Canada',
  'AU': 'Australia',
  'IT': 'Italy',
  'ES': 'Spain',
  'MX': 'Mexico',
  'ID': 'Indonesia',
  'TR': 'Turkey',
  'SA': 'Saudi Arabia',
  'TH': 'Thailand',
  'VN': 'Vietnam',
  'NL': 'Netherlands',
  'PL': 'Poland',
  'SE': 'Sweden',
  'NO': 'Norway',
  'FI': 'Finland',
  'DK': 'Denmark',
  'CH': 'Switzerland',
  'AT': 'Austria',
  'BE': 'Belgium',
  'IE': 'Ireland',
  'PT': 'Portugal',
  'GR': 'Greece',
  'CZ': 'Czech Republic',
  'HU': 'Hungary',
  'RO': 'Romania',
  'UA': 'Ukraine',
  'EG': 'Egypt',
  'ZA': 'South Africa',
  'NG': 'Nigeria',
  'KE': 'Kenya',
  'AR': 'Argentina',
  'CL': 'Chile',
  'CO': 'Colombia',
  'PE': 'Peru',
  'VE': 'Venezuela',
  'EC': 'Ecuador',
  'UY': 'Uruguay',
  'PA': 'Panama',
  'CR': 'Costa Rica',
  'PH': 'Philippines',
  'MY': 'Malaysia',
  'SG': 'Singapore',
  'PK': 'Pakistan',
  'BD': 'Bangladesh',
  'LK': 'Sri Lanka',
  'NP': 'Nepal',
  'AE': 'United Arab Emirates',
  'IL': 'Israel',
  'IR': 'Iran',
  'IQ': 'Iraq',
  'KW': 'Kuwait',
  'QA': 'Qatar',
  'BH': 'Bahrain',
  'OM': 'Oman',
  'JO': 'Jordan',
  'LB': 'Lebanon',
  'SY': 'Syria',
  'NZ': 'New Zealand',
  'HK': 'Hong Kong',
  'TW': 'Taiwan',
};

export function WorldMapChart({ data, onCountryClick }: WorldMapChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<echarts.ECharts | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    if (!chartRef.current) return;

    const chart = echarts.init(chartRef.current);
    chartInstanceRef.current = chart;

    fetch('https://cdn.jsdelivr.net/npm/echarts@4.9.1/map/json/world.json')
      .then(response => response.json())
      .then(geoJSON => {
        echarts.registerMap('world', geoJSON);
        setMapLoaded(true);
      })
      .catch(err => {
        console.error('Failed to load world map:', err);
      });

    return () => {
      chart.dispose();
    };
  }, []);

  useEffect(() => {
    if (!mapLoaded || !chartInstanceRef.current || data.length === 0) return;

    const chart = chartInstanceRef.current;
    const maxViews = Math.max(...data.map(d => d.views));
    const mapData = data.map(d => {
      const countryName = COUNTRY_NAME_MAP[d.country] || d.country;
      return { name: countryName, value: d.views };
    });

    const option = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(30, 41, 59, 0.95)',
        borderColor: 'rgba(71, 85, 105, 0.5)',
        textStyle: { color: '#f1f5f9', fontSize: 12 },
        formatter: (params: any) => {
          if (!params.data) return '';
          return `<div style="font-weight: 600; margin-bottom: 4px;">${params.name}</div><div style="color: #94a3b8;">访问量: <span style="color: #60a5fa; font-weight: 600;">${params.data.value?.toLocaleString() || 0}</span></div>`;
        },
      },
      visualMap: {
        type: 'continuous',
        min: 0,
        max: maxViews,
        left: 'left',
        top: 'bottom',
        text: ['高', '低'],
        textStyle: { color: '#94a3b8' },
        calculable: true,
        inRange: { color: ['#1e3a5f', '#2563eb', '#60a5fa', '#93c5fd', '#bfdbfe'] },
        itemWidth: 20,
        itemHeight: 140,
      },
      series: [{
        name: '访问量',
        type: 'map',
        map: 'world',
        roam: true,
        scaleLimit: { min: 1, max: 5 },
        zoom: 1.2,
        center: [0, 20],
        emphasis: {
          itemStyle: { areaColor: '#fbbf24', borderColor: '#fff', borderWidth: 2 },
          label: { show: false },
        },
        itemStyle: { areaColor: '#1e293b', borderColor: '#334155', borderWidth: 0.5 },
        select: { disabled: true },
        data: mapData,
      }],
    };

    chart.setOption(option);
    chart.off('click');
    chart.on('click', (params: any) => {
      if (params.name) onCountryClick(params.name);
    });
  }, [mapLoaded, data, onCountryClick]);

  return (
    <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/30">
      <h3 className="text-lg font-semibold text-white mb-4">全球访问分布</h3>
      <div ref={chartRef} style={{ width: '100%', height: '400px' }} className="rounded-xl" />
    </div>
  );
}