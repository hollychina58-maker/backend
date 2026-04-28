// CORS configuration - restrict origins for security
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://localhost:3001,https://mmes-mcti.com,https://mmes-website-production.up.railway.app').split(',');

export function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return false;
  return ALLOWED_ORIGINS.some(allowed => allowed.trim() === origin);
}

export const corsHeaders = {
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export function getCorsHeaders(requestOrigin: string | null): Record<string, string> {
  const headers: Record<string, string> = { ...corsHeaders };

  if (requestOrigin && isOriginAllowed(requestOrigin)) {
    headers['Access-Control-Allow-Origin'] = requestOrigin;
  }

  return headers;
}
