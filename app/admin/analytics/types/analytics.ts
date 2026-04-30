// Analytics data types

export interface PageView {
  date: string;
  views: number;
}

export interface ProductClick {
  product_id: string;
  clicks: number;
}

export interface CountryStats {
  country: string;
  views: number;
  uniqueVisitors?: number;
}

export interface PageStats {
  page_url: string;
  views: number;
}

export interface ReferrerStats {
  referrer: string;
  visits: number;
  percentage: number;
}

export interface CountryDetail {
  country: string;
  uniqueVisitors: number;
  totalViews: number;
  topPages: PageStats[];
  topProducts: ProductClick[];
  viewsByDay: PageView[];
  referrers: ReferrerStats[];
}

export interface AnalyticsStats {
  totalViews: number;
  uniqueVisitors: number;
  viewsByDay: PageView[];
  topProducts: ProductClick[];
  topCountries: CountryStats[];
  topPages: PageStats[];
  referrers: ReferrerStats[];
}

export interface CountryDetailResponse {
  success: boolean;
  data?: CountryDetail;
  error?: string;
}

export interface StatsResponse {
  success: boolean;
  data?: AnalyticsStats;
  error?: string;
}