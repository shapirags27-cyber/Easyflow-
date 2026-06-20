import { generateSecret, generateURI, verify } from "otplib";
import QRCode from "qrcode";

const APP_NAME = "EasyFlow Admin";

export function generateTotpSecret(): string {
  return generateSecret();
}

export async function verifyTotpCode(secret: string, code: string): Promise<boolean> {
  const normalized = code.replace(/\s/g, "");
  if (!/^\d{6}$/.test(normalized)) return false;
  const result = await verify({ secret, token: normalized });
  return result.valid;
}

export function getTotpUri(email: string, secret: string): string {
  return generateURI({ issuer: APP_NAME, label: email, secret });
}

export async function generateTotpQrDataUrl(email: string, secret: string): Promise<string> {
  const uri = getTotpUri(email, secret);
  return QRCode.toDataURL(uri, { width: 256, margin: 2 });
}
