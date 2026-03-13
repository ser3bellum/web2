import { Nango } from '@nangohq/node';

export function getNango() {
  
  const secretKey =
  process.env.NANGO_SECRET_KEY ||
  "b85f5415-e248-421d-9d40-1d678ae6d4e1";
  
  if (!secretKey) {
    throw new Error('Missing NANGO_SECRET_KEY');
  }
  return new Nango({ secretKey });
}