import { Nango } from "@nangohq/node";

export function getNango() {
  const secretKey = process.env.NANGO_SECRET_KEY_PROD;

  if (!secretKey) {
    throw new Error("Missing NANGO_SECRET_KEY_PROD");
  }

  return new Nango({ secretKey });
}