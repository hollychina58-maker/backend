'use client';

import { useState, useCallback } from 'react';
import { AdminHeader } from '../../../components/AdminHeader';
import { useAnalyticsData } from './hooks/useAnalyticsData';
import { StatsCards } from './components/StatsCards';
import { TrendLineChart } from './components/TrendLineChart';
import { WorldMapChart } from './components/WorldMapChart';
import { TopCountriesTable } from './components/TopCountriesTable';
import { ReferrerChart } from './components/ReferrerChart';
import { CountryDetailModal } from './components/CountryDetailModal';

export default function AnalyticsPage() {
  const [days, setDays] = useState(30);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const {
    stats,
    loading,
    error,
    lastUpdated,
    refresh,
    countryDetail,
    fetchCountryDetail,
    countryLoading
  } = useAnalyticsData(days);

  const handleCountryClick = useCallback((country: string) => {
    setSelectedCountry(country);
    fetchCountryDetail(country);
  }, [fetchCountryDetail]);

  const handleCloseModal = useCallback(() => {
    setSelectedCountry(null);
  }, []);

  return (
    <>
      <AdminHeader title="数据分析" />
      <div className="p-6 min-h-screen bg-slate-900/30">
        {/* Stats Cards with Refresh */}
        <StatsCards
          totalViews={stats?.totalViews || 0}
          uniqueVisitors={stats?.uniqueVisitors || 0}
          avgDailyViews={stats && stats.viewsByDay.length > 0 ? Math.round(stats.totalViews / stats.viewsByDay.length) : 0}
          lastUpdated={lastUpdated}
          onRefresh={refresh}
        />

        {/* Error State */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading && !stats ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin w-10 h-10 border-3 border-blue-500 border-t-transparent rounded-full" />
          </div>
        ) : stats ? (
          <>
            {/* Top Row: Trend Chart + Referrer Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              <div className="lg:col-span-2">
                <TrendLineChart data={stats.viewsByDay} />
              </div>
              <div>
                <ReferrerChart data={stats.referrers} />
              </div>
            </div>

            {/* Middle Row: World Map + Country Table */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              <div className="lg:col-span-2">
                <WorldMapChart
                  data={stats.topCountries}
                  onCountryClick={handleCountryClick}
                />
              </div>
              <div>
                <TopCountriesTable
                  data={stats.topCountries}
                  onCountryClick={handleCountryClick}
                />
              </div>
            </div>
          </>
        ) : null}
      </div>

      {/* Country Detail Modal */}
      <CountryDetailModal
        country={selectedCountry || ''}
        data={countryDetail}
        loading={countryLoading}
        onClose={handleCloseModal}
      />
    </>
  );
}
