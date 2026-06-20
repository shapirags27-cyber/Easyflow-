import { createHash, randomBytes } from "crypto";

export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function generateRecoveryCodes(count = 10): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const part = randomBytes(4).toString("hex").toUpperCase();
    codes.push(`${part.slice(0, 4)}-${part.slice(4)}`);
  }
  return codes;
}
