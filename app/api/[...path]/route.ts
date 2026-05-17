import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const BACKEND_URL = (process.env.API_TARGET || process.env.NEXT_PUBLIC_API_TARGET || 'https://school-server-b264c1a1fac6.herokuapp.com').replace(/\/$/, '');
const HOP_BY_HOP_HEADERS = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
  'host',
  'content-length',
]);

function buildTargetUrl(request: NextRequest, path: string[]) {
  const target = new URL(`${BACKEND_URL}/api/${path.join('/')}`);
  request.nextUrl.searchParams.forEach((value, key) => target.searchParams.set(key, value));
  return target;
}

function buildHeaders(request: NextRequest) {
  const headers = new Headers();
  request.headers.forEach((value, key) => {
    if (!HOP_BY_HOP_HEADERS.has(key.toLowerCase())) headers.set(key, value);
  });
  headers.set('x-forwarded-host', request.headers.get('host') || '');
  headers.set('x-forwarded-proto', 'https');
  return headers;
}

async function proxy(request: NextRequest, context: { params: { path: string[] } }) {
  const targetUrl = buildTargetUrl(request, context.params.path || []);
  const method = request.method.toUpperCase();

  try {
    const body = method === 'GET' || method === 'HEAD' ? undefined : await request.arrayBuffer();
    const response = await fetch(targetUrl, {
      method,
      headers: buildHeaders(request),
      body,
      redirect: 'manual',
      cache: 'no-store',
    });

    const responseHeaders = new Headers(response.headers);
    responseHeaders.delete('content-encoding');
    responseHeaders.delete('content-length');
    responseHeaders.set('cache-control', 'no-store');

    return new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        message: 'API proxy failed',
        target: targetUrl.origin,
        error: error?.message || String(error),
      },
      { status: 502 }
    );
  }
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
export const OPTIONS = proxy;
