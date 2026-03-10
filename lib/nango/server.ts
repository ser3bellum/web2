import { Nango } from '@nangohq/node';

export function getNango() {
  const secretKey = process.env.NANGO_SECRET_KEY;
  if (!secretKey) {
    throw new Error('Missing NANGO_SECRET_KEY');
  }
  return new Nango({ secretKey });
}