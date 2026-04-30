'use client';

import { MapPin } from 'lucide-react';
import type { CountryStats } from '../types/analytics';

// Code to name mapping
const COUNTRY_CODE_TO_NAME: Record<string, string> = {
  'CN': 'China', 'US': 'United States', 'DE': 'Germany', 'FR': 'France',
  'GB': 'United Kingdom', 'JP': 'Japan', 'KR': 'South Korea', 'IN': 'India',
  'BR': 'Brazil', 'RU': 'Russia', 'CA': 'Canada', 'AU': 'Australia',
  'IT': 'Italy', 'ES': 'Spain', 'MX': 'Mexico', 'ID': 'Indonesia',
  'TR': 'Turkey', 'SA': 'Saudi Arabia', 'TH': 'Thailand', 'VN': 'Vietnam',
  'NL': 'Netherlands', 'PL': 'Poland', 'SE': 'Sweden', 'NO': 'Norway',
  'FI': 'Finland', 'DK': 'Denmark', 'CH': 'Switzerland', 'AT': 'Austria',
  'BE': 'Belgium', 'IE': 'Ireland', 'PT': 'Portugal', 'GR': 'Greece',
  'CZ': 'Czech Republic', 'HU': 'Hungary', 'RO': 'Romania', 'UA': 'Ukraine',
  'EG': 'Egypt', 'ZA': 'South Africa', 'NG': 'Nigeria', 'KE': 'Kenya',
  'AR': 'Argentina', 'CL': 'Chile', 'CO': 'Colombia', 'PE': 'Peru',
  'VE': 'Venezuela', 'EC': 'Ecuador', 'UY': 'Uruguay', 'PA': 'Panama',
  'CR': 'Costa Rica', 'PH': 'Philippines', 'MY': 'Malaysia', 'SG': 'Singapore',
  'PK': 'Pakistan', 'BD': 'Bangladesh', 'LK': 'Sri Lanka', 'NP': 'Nepal',
  'AE': 'United Arab Emirates', 'IL': 'Israel', 'IR': 'Iran', 'IQ': 'Iraq',
  'KW': 'Kuwait', 'QA': 'Qatar', 'BH': 'Bahrain', 'OM': 'Oman',
  'JO': 'Jordan', 'LB': 'Lebanon', 'SY': 'Syria', 'NZ': 'New Zealand',
  'HK': 'Hong Kong', 'TW': 'Taiwan',
};

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
                      {COUNTRY_CODE_TO_NAME[country.country] || country.country}
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