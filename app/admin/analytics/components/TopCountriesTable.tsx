'use client';

import { MapPin } from 'lucide-react';
import type { CountryStats } from '../types/analytics';

interface TopCountriesTableProps {
  data: CountryStats[];
  onCountryClick: (country: string) => void;
}

export function TopCountriesTable({ data, onCountryClick }: TopCountriesTableProps) {
  const maxViews = data.length > 0 ? Math.max(...data.map(d => d.views)) : 0;

  return (
    <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/30">
      <h3 className="text-lg font-semibold text-white mb-4">热门国家/地区</h3>
      {data.length > 0 ? (
        <div className="space-y-3">
          {data.slice(0, 10).map((country, index) => {
            const percentage = maxViews > 0 ? (country.views / maxViews) * 100 : 0;
            return (
              <div
                key={country.country}
                className="group cursor-pointer"
                onClick={() => onCountryClick(country.country)}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-500 w-6">{index + 1}</span>
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-white font-medium group-hover:text-blue-400 transition-colors">
                      {country.country}
                    </span>
                  </div>
                  <span className="text-sm text-blue-400 font-medium">
                    {country.views.toLocaleString()}
                  </span>
                </div>
                <div className="ml-8 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-8 text-center text-slate-500">
          暂无数据
        </div>
      )}
    </div>
  );
}