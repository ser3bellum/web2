import { NextResponse } from 'next/server';
import crypto from 'crypto';

function timingSafeEqual(a: string, b: string) {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
}

export async function POST(req: Request) {
  const rawBody = await req.text();
  const sig = req.headers.get('x-nango-hmac-sha256');

  const webhookSecret = process.env.NANGO_WEBHOOK_SECRET;

  // If you haven't configured webhook secrets yet, you can temporarily accept
  // but I strongly recommend enabling verification before real customers.
  if (webhookSecret && sig) {
    const expected = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');

    if (!timingSafeEqual(expected, sig)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }
  }

  const event = JSON.parse(rawBody);
  console.log('Nango webhook event:', event);

  // TODO: update your DB connection status, lastConnectedAt, etc.
  return NextResponse.json({ ok: true });
}