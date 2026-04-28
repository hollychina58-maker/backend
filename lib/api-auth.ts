// API Authentication helper

export function saveApiKey(key: string): void {
  sessionStorage.setItem('admin_api_key', key);
}

export function getApiKey(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem('admin_api_key');
}

export function clearApiKey(): void {
  sessionStorage.removeItem('admin_api_key');
}

export function getAuthHeader(): Record<string, string> {
  const apiKey = getApiKey();
  if (!apiKey) return {};
  return {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };
}

export function isAuthenticated(): boolean {
  return !!getApiKey();
}