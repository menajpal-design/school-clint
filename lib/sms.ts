// SMS helpers: encoding detection, segment calculation, and credentials
export type SmsEncoding = 'GSM' | 'Unicode';

const GSM_CHARSET = `@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !"#%&'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà`;

function isGsm7(text: string): boolean {
  for (const ch of text) {
    if (!GSM_CHARSET.includes(ch)) {
      return false;
    }
  }
  return true;
}

export function calculateSmsSegments(text: string) {
  const encoding: SmsEncoding = isGsm7(text) ? 'GSM' : 'Unicode';
  const length = text.length;
  const single = encoding === 'GSM' ? 160 : 70;
  const perSegment = encoding === 'GSM' ? 153 : 67;
  const segments = length === 0 ? 0 : (length <= single ? 1 : Math.ceil(length / perSegment));
  const credits = segments; // 1 credit per segment
  return { encoding, length, single, perSegment, segments, credits };
}

// Ensure usernames are ASCII-safe (slug style)
export function sanitizeUsername(input?: string, maxLen = 40) {
  const s = String(input || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, maxLen);
  return s || `user-${Math.random().toString(36).slice(2, 8)}`;
}

// Generate an ASCII alphanumeric password safe for SMS
export function generateAsciiPassword(length = 10) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let out = '';
  for (let i = 0; i < length; i++) {
    out += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return out;
}

// Simple send wrapper for the anoncify-style API: expects `key`, `number`, `msg` params.
export async function sendSms(apiUrl: string, key: string, number: string, msg: string) {
  // Note: many providers detect encoding themselves; we attach metadata for logging.
  const meta = calculateSmsSegments(msg);

  // Demo mode: if no apiUrl is provided or apiUrl indicates demo, do not send a real SMS.
  if (!apiUrl || apiUrl === 'demo' || apiUrl.toLowerCase().includes('demo')) {
    return { ok: true, status: 200, body: 'DEMO_MODE: message not sent', meta, demo: true };
  }

  const body = new URLSearchParams();
  body.set('key', key);
  body.set('number', number);
  body.set('msg', msg);

  try {
    const res = await fetch(apiUrl, { method: 'POST', body });
    const text = await res.text();
    return { ok: res.ok, status: res.status, body: text, meta };
  } catch (err: any) {
    return { ok: false, status: 0, body: String(err), meta };
  }
}

export default {
  isGsm7,
  calculateSmsSegments,
  sanitizeUsername,
  generateAsciiPassword,
  sendSms,
};
