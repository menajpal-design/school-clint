import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory rate limiter for Next.js middleware.
// NOTE: This is a fallback suitable for small deployments and testing.
// For production use a centralized store (Redis, Upstash, etc.) so limits
// are shared across instances.

type Entry = { count: number; resetAt: number };

const WINDOW_SECONDS = Number(process.env.RATE_LIMIT_WINDOW_SECONDS || 900); // 15 minutes
const MAX_REQUESTS = Number(process.env.RATE_LIMIT_MAX_REQUESTS || 100);

const store: Map<string, Entry> = new Map();

function getIpKey(req: NextRequest) {
  // Trust X-Forwarded-For when behind a proxy (add appropriate proxy config in deployment)
  const forwarded = req.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : req.ip || 'unknown';
  return `${ip}:${req.nextUrl.pathname}`;
}

export function middleware(req: NextRequest) {
  try {
    const key = getIpKey(req);
    const now = Date.now();
    const entry = store.get(key);

    if (!entry || entry.resetAt <= now) {
      store.set(key, { count: 1, resetAt: now + WINDOW_SECONDS * 1000 });
    } else {
      entry.count += 1;
      store.set(key, entry);
    }

    const current = store.get(key)!;

    // Set rate limit response headers on all responses
    const remaining = Math.max(0, MAX_REQUESTS - current.count);
    const reset = Math.ceil((current.resetAt - now) / 1000);

    if (current.count > MAX_REQUESTS) {
      const res = NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      );
      res.headers.set('Retry-After', String(reset));
      res.headers.set('X-RateLimit-Limit', String(MAX_REQUESTS));
      res.headers.set('X-RateLimit-Remaining', '0');
      res.headers.set('X-RateLimit-Reset', String(reset));
      return res;
    }

    const res = NextResponse.next();
    res.headers.set('X-RateLimit-Limit', String(MAX_REQUESTS));
    res.headers.set('X-RateLimit-Remaining', String(remaining));
    res.headers.set('X-RateLimit-Reset', String(reset));
    return res;
  } catch (err) {
    return NextResponse.next();
  }
}

export const config = {
  // Apply to API and auth endpoints; adjust matcher as needed.
  matcher: ['/api/:path*', '/auth/:path*'],
};
