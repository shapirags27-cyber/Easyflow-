import { NextResponse } from "next/server";
import type { Hex } from "viem";
import { createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { iopnTestnet } from "@/lib/chains";
import {
  assertFeeBounds,
  buildFeeUpdateMessage,
  verifyAdminSignature
} from "@/lib/server/admin-auth";
import { encodeSetFeesTx, readProtocolFees } from "@/lib/server/fees";
import { prisma } from "@/lib/db";
import { ADMIN_ADDRESS } from "@/lib/admin";
import { dbHealthCheck } from "@/lib/db";

/** Admin backend: read current fee configuration from chain. */
export async function GET() {
  try {
    const fees = await readProtocolFees();
    return NextResponse.json({ fees, source: "on-chain" });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to read fees";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

type PostBody = {
  swapFeeBps: number;
  multisendFeeBps: number;
  stakingFeeBps: number;
  timestamp: number;
  signature: Hex;
};

/**
 * Admin backend: validate admin signature + fee bounds, then either:
 * - submit on-chain tx when ADMIN_PRIVATE_KEY is set, or
 * - return encoded calldata for the admin wallet to execute.
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as PostBody;
    const { swapFeeBps, multisendFeeBps, stakingFeeBps, timestamp, signature } = body;

    if (!signature || !timestamp) {
      return NextResponse.json({ error: "Missing signature or timestamp" }, { status: 400 });
    }

    const now = Date.now();
    if (Math.abs(now - timestamp) > 5 * 60 * 1000) {
      return NextResponse.json({ error: "Signature expired" }, { status: 401 });
    }

    assertFeeBounds({ swapFeeBps, multisendFeeBps, stakingFeeBps });

    const message = buildFeeUpdateMessage({
      swapFeeBps,
      multisendFeeBps,
      stakingFeeBps,
      timestamp
    });

    const ok = await verifyAdminSignature({ message, signature });
    if (!ok) {
      return NextResponse.json({ error: "Invalid admin signature" }, { status: 403 });
    }

    const tx = encodeSetFeesTx({ swapFeeBps, multisendFeeBps, stakingFeeBps });

    const feesPayload = { swapFeeBps, multisendFeeBps, stakingFeeBps };
    if (await dbHealthCheck()) {
      await prisma.adminAuditLog.create({
        data: {
          admin: ADMIN_ADDRESS,
          action: "setFees",
          payload: feesPayload
        }
      });
    }

    const pk = process.env.ADMIN_PRIVATE_KEY;
    if (pk) {
      const account = privateKeyToAccount(pk as Hex);
      const wallet = createWalletClient({
        account,
        chain: iopnTestnet,
        transport: http(iopnTestnet.rpcUrls.default.http[0])
      });
      const hash = await wallet.writeContract({
        address: tx.to,
        abi: [
          {
            type: "function",
            name: "setFees",
            stateMutability: "nonpayable",
            inputs: [
              { name: "swapBps", type: "uint256" },
              { name: "multisendBps", type: "uint256" },
              { name: "stakeBps", type: "uint256" }
            ],
            outputs: []
          }
        ],
        functionName: "setFees",
        args: [BigInt(swapFeeBps), BigInt(multisendFeeBps), BigInt(stakingFeeBps)]
      });
      return NextResponse.json({
        success: true,
        mode: "server-submitted",
        txHash: hash,
        fees: { swapFeeBps, multisendFeeBps, stakingFeeBps }
      });
    }

    return NextResponse.json({
      success: true,
      mode: "client-submit",
      transaction: tx,
      fees: { swapFeeBps, multisendFeeBps, stakingFeeBps }
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Fee update failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
