import { NextRequest, NextResponse } from 'next/server';

// ─────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────
const MAIN_DOMAIN = process.env.NEXT_PUBLIC_MAIN_DOMAIN || 'easyschool.live';
const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:5000/api';

// Rate limiting (simple in-memory — fine for single-instance deployments)
// For multi-instance production use Redis / Upstash instead.
type Entry = { count: number; resetAt: number };
const WINDOW_SECONDS = Number(process.env.RATE_LIMIT_WINDOW_SECONDS || 900); // 15 min
const MAX_REQUESTS = Number(process.env.RATE_LIMIT_MAX_REQUESTS || 100);
const rateLimitStore: Map<string, Entry> = new Map();

function getIpKey(req: NextRequest, suffix = '') {
  const forwarded = req.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : (req as any).ip || 'unknown';
  return `${ip}:${req.nextUrl.pathname}${suffix}`;
}

function applyRateLimit(req: NextRequest): NextResponse | null {
  const key = getIpKey(req);
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || entry.resetAt <= now) {
    rateLimitStore.set(key, { count: 1, resetAt: now + WINDOW_SECONDS * 1000 });
  } else {
    entry.count += 1;
    rateLimitStore.set(key, entry);
  }

  const current = rateLimitStore.get(key)!;
  const remaining = Math.max(0, MAX_REQUESTS - current.count);
  const reset = Math.ceil((current.resetAt - now) / 1000);

  if (current.count > MAX_REQUESTS) {
    const res = NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    res.headers.set('Retry-After', String(reset));
    res.headers.set('X-RateLimit-Limit', String(MAX_REQUESTS));
    res.headers.set('X-RateLimit-Remaining', '0');
    res.headers.set('X-RateLimit-Reset', String(reset));
    return res;
  }

  // Return headers to be attached downstream (no block)
  return null; // null = allowed
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

/**
 * Extract the subdomain from the request hostname.
 * Returns null if the request is to the bare main domain (or www),
 * and returns the subdomain string if one is present.
 */
function extractSubdomain(hostname: string): string | null {
  if (process.env.NEXT_PUBLIC_ENABLE_SUBDOMAINS === 'false') return null;
  const cleanHost = (hostname || '').split(':')[0].toLowerCase();
  if (
    cleanHost.includes('vercel.app') ||
    cleanHost.includes('onrender.com') ||
    cleanHost.includes('herokuapp.com') ||
    cleanHost.includes('railway.app')
  ) {
    return null;
  }

  // Local dev support: foo.localhost or foo.127.0.0.1
  const isLocalhost =
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname.endsWith('.localhost') ||
    hostname.endsWith('.127.0.0.1');

  if (isLocalhost) {
    // e.g. "school1.localhost" → subdomain = "school1"
    const parts = hostname.split('.');
    if (parts.length >= 2 && parts[0] !== 'localhost' && parts[0] !== '127') {
      return parts[0];
    }
    return null;
  }

  // Production: easyschool.live  or  www.easyschool.live  → no subdomain
  //             school1.easyschool.live                    → subdomain = "school1"
  if (hostname === MAIN_DOMAIN || hostname === `www.${MAIN_DOMAIN}`) {
    return null;
  }

  if (hostname.endsWith(`.${MAIN_DOMAIN}`)) {
    const sub = hostname.slice(0, hostname.length - MAIN_DOMAIN.length - 1);
    // Ignore "www" as a subdomain
    if (sub && sub !== 'www') return sub;
  }

  return null;
}

/**
 * Validate subdomain against the server API.
 * Returns true if the subdomain is registered AND active.
 * Falls back to true on network errors so the app stays accessible.
 */
async function isSubdomainValid(subdomain: string): Promise<boolean> {
  try {
    const url = `${API_URL}/institution/subdomain/validate?subdomain=${encodeURIComponent(subdomain)}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      // Short timeout so we don't block the page for too long
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return false;
    const data = await response.json();
    return data.valid === true;
  } catch {
    // Network error or timeout → allow through (fail-open) to avoid locking out users
    return true;
  }
}

/**
 * Build the main domain URL (e.g. https://easyschool.live)
 */
function buildMainDomainUrl(req: NextRequest): string {
  const protocol = req.headers.get('x-forwarded-proto') || 'https';
  return `${protocol}://${MAIN_DOMAIN}`;
}

// ─────────────────────────────────────────────
// Middleware
// ─────────────────────────────────────────────
export async function middleware(req: NextRequest) {
  try {
    const hostname = req.headers.get('host') || req.nextUrl.hostname;
    // Strip port from hostname for subdomain detection
    const bareHostname = hostname.split(':')[0];
    const pathname = req.nextUrl.pathname;

    // ── 1. Rate-limit API / auth routes ────────────────────────────────
    if (pathname.startsWith('/api/') || pathname.startsWith('/auth/')) {
      const blocked = applyRateLimit(req);
      if (blocked) return blocked;
    }

    // ── 2. Skip static assets and Next.js internals ────────────────────
    if (
      pathname.startsWith('/_next/') ||
      pathname.startsWith('/favicon') ||
      pathname.startsWith('/icon') ||
      pathname.startsWith('/apple-icon') ||
      pathname === '/school-not-found'
    ) {
      return NextResponse.next();
    }

    // ── 3. Detect subdomain ────────────────────────────────────────────
    const subdomain = extractSubdomain(bareHostname);

    // No subdomain → main domain traffic, pass through normally
    if (!subdomain) {
      return NextResponse.next();
    }

    // ── 4. Validate subdomain against the server ───────────────────────
    const valid = await isSubdomainValid(subdomain);

    if (!valid) {
      // Rewrite to the school-not-found page (passes subdomain as query param)
      // This keeps the URL in the browser unchanged while showing the error page.
      const url = req.nextUrl.clone();
      url.pathname = '/school-not-found';
      url.searchParams.set('subdomain', subdomain);
      url.searchParams.set('from', MAIN_DOMAIN);
      return NextResponse.rewrite(url);
    }

    // Subdomain is valid → allow normal request
    return NextResponse.next();
  } catch {
    // Safety net: never break the app due to middleware errors
    return NextResponse.next();
  }
}

export const config = {
  // Run on all routes except Next.js internals and static files
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icon.svg|apple-icon.svg).*)',
  ],
};
