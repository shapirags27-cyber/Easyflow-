import { verifyMessage, type Address, type Hex } from "viem";
import { ADMIN_ADDRESS } from "@/lib/admin";
import { buildFeeUpdateMessage, type FeeUpdatePayload } from "@/lib/admin-messages";

export { buildFeeUpdateMessage, type FeeUpdatePayload };

export async function verifyAdminSignature(params: {
  message: string;
  signature: Hex;
}): Promise<boolean> {
  const valid = await verifyMessage({
    address: ADMIN_ADDRESS,
    message: params.message,
    signature: params.signature
  });
  return valid;
}

export function assertFeeBounds(fees: {
  swapFeeBps: number;
  multisendFeeBps: number;
  stakingFeeBps: number;
}) {
  const max = 1000;
  for (const [key, val] of Object.entries(fees)) {
    if (!Number.isInteger(val) || val < 0 || val > max) {
      throw new Error(`Invalid ${key}: must be 0-${max} bps`);
    }
  }
}

export function isAdminAddress(address?: string | null): address is Address {
  return Boolean(
    address && address.toLowerCase() === ADMIN_ADDRESS.toLowerCase()
  );
}
