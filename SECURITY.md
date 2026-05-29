# SECURITY

This document summarizes immediate production security hardening steps and recommendations.

## What I changed
- Added strict security headers and a Content Security Policy in `next.config.js`.

## Immediate actions to run locally
- Audit dependencies:

```bash
npm audit --production
npm outdated
```

- Update vulnerable packages (review changes before upgrading):

```bash
npm update
npm audit fix
```

## Secrets and environment
- Never expose secrets with `NEXT_PUBLIC_` prefix. Move API keys and secrets to server-only environment variables and reference them from server code.
- Use `process.env` on the server and a `.env.local` for local testing. Add `.env.local` to `.gitignore`.

## Transport & cookies
- Serve the app only over HTTPS (use Cloudflare, Vercel, or an HTTPS-terminating load balancer).
- Set cookies with `Secure; HttpOnly; SameSite=Strict` and reasonable `Max-Age`.

## App & API protections
- Implement rate limiting and brute-force protection on auth endpoints.
- Validate and sanitize all incoming data (Zod is already included — use it for all API inputs).
- Add CSRF protection for state-changing requests (or ensure same-site cookies and proper CORS allowlist).

## CSRF & CORS (how this project handles it)

- This project uses the double-submit cookie pattern for CSRF protection: the server exposes `GET /api/csrf/token` which returns a token and sets a non-HttpOnly cookie `csrf_token`. All state-changing requests (POST/PUT/PATCH/DELETE) must include the same token in the `x-csrf-token` header.
- The server sets authentication cookies as `HttpOnly` (access and refresh cookies). The CSRF cookie is deliberately readable by client JavaScript so it can be copied into the header for each request.
- CORS is restricted by `ALLOWED_ORIGINS` in the server config. For production, set `ALLOWED_ORIGINS` to your frontend origin(s) (comma-separated) and do NOT use `*`.

Client integration (example):

```js
// Example helper to fetch CSRF token and use it in requests
async function fetchCsrfToken() {
  const res = await fetch('/api/csrf/token', { credentials: 'include' });
  const data = await res.json();
  return data.csrfToken;
}

async function postData(url, payload) {
  const token = await fetchCsrfToken();
  return fetch(url, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'x-csrf-token': token,
    },
    body: JSON.stringify(payload),
  });
}
```

Deployment notes:
- Ensure `NODE_ENV=production`, serve over HTTPS, and set `ALLOWED_ORIGINS` to the frontend origin. Cookies used for authentication require `Secure; SameSite=None` when frontend and API are on different domains.
- Add these env vars on the server (see `school-server/.env.example`): `AUTH_COOKIE_NAME`, `REFRESH_COOKIE_NAME`, `CSRF_COOKIE_NAME`, `CSRF_HEADER_NAME`, `ALLOWED_ORIGINS`, and `CORS_ALLOW_ALL`.


## Monitoring & CI
- Add automated dependency scans (Dependabot, Snyk, or GitHub CodeQL) and `npm audit` in CI.
- Add centralized error monitoring (Sentry) and log redaction to avoid leaking secrets.

## Recommended next development tasks
1. Move any sensitive server logic (authentication, payment, SMS keys) to `school-server` and ensure keys live in server env only.
2. Add rate-limiter middleware in `client/src` API routes or on the server (IP + user throttling).
3. Harden authentication: short-lived tokens, refresh token rotation, revoke endpoints.
4. Add automated security checks to GitHub Actions:

```yaml
name: Security
on: [push]
jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - run: npm ci
      - run: npm audit --audit-level=moderate
```

## Notes
- The CSP added is a conservative starting point — test thoroughly (scripts/styles may need additional sources).
- Review all `NEXT_PUBLIC_` env usage and remove any that expose secrets.

If you want, I can implement the next steps: move secrets, add rate-limiting middleware, or add CI security checks.
