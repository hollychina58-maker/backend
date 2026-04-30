'use client';

import { useState, useEffect, useCallback } from 'react';
import type { AnalyticsStats, CountryDetail } from '../types/analytics';

const POLL_INTERVAL = 2 * 60 * 60 * 1000; // 2 hours

interface UseAnalyticsDataReturn {
  stats: AnalyticsStats | null;
  loading: boolean;
  error: string;
  lastUpdated: Date | null;
  refresh: () => void;
  countryDetail: CountryDetail | null;
  countryLoading: boolean;
  fetchCountryDetail: (country: string) => Promise<CountryDetail | null>;
}

export function useAnalyticsData(days: number = 30): UseAnalyticsDataReturn {
  const [stats, setStats] = useState<AnalyticsStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [countryDetail, setCountryDetail] = useState<CountryDetail | null>(null);
  const [countryLoading, setCountryLoading] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`/api/analytics/stats?days=${days}`);

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${res.status}`);
      }

      const data = await res.json();
      if (data.success && data.data) {
        setStats(data.data);
        setLastUpdated(new Date());
        setError('');
      } else {
        throw new Error(data.error || '获取统计数据失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '网络错误');
    } finally {
      setLoading(false);
    }
  }, [days]);

  const refresh = useCallback(() => {
    setLoading(true);
    fetchStats();
  }, [fetchStats]);

  const fetchCountryDetail = useCallback(async (country: string): Promise<CountryDetail | null> => {
    setCountryLoading(true);
    setCountryDetail(null);
    try {
      const res = await fetch(`/api/analytics/country/${encodeURIComponent(country)}?days=${days}`);

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${res.status}`);
      }

      const data = await res.json();
      if (data.success && data.data) {
        setCountryDetail(data.data);
        return data.data;
      }
      return null;
    } catch (err) {
      console.error('[Analytics] Failed to fetch country detail:', err);
      return null;
    } finally {
      setCountryLoading(false);
    }
  }, [days]);

  useEffect(() => {
    fetchStats();

    const interval = setInterval(fetchStats, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    lastUpdated,
    refresh,
    countryDetail,
    countryLoading,
    fetchCountryDetail,
  };
}