import { NextResponse } from "next/server";
import type { Hex } from "viem";
import { createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { iopnTestnet } from "@/lib/chains";
import { assertFeeBounds } from "@/lib/server/admin-auth";
import { encodeSetFeesTx, readProtocolFees } from "@/lib/server/fees";
import { prisma } from "@/lib/db";
import { dbHealthCheck } from "@/lib/db";
import { adminErrorResponse, requireAdmin } from "@/lib/server/admin/require-admin";
import { getClientMeta, logAdminActivity } from "@/lib/server/admin/audit";

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
};

export async function POST(req: Request) {
  try {
    const session = await requireAdmin(req, "fees:write");
    const meta = getClientMeta(req);
    const body = (await req.json()) as PostBody;
    const { swapFeeBps, multisendFeeBps, stakingFeeBps } = body;

    assertFeeBounds({ swapFeeBps, multisendFeeBps, stakingFeeBps });

    const tx = encodeSetFeesTx({ swapFeeBps, multisendFeeBps, stakingFeeBps });
    const feesPayload = { swapFeeBps, multisendFeeBps, stakingFeeBps };

    if (await dbHealthCheck()) {
      await prisma.adminAuditLog.create({
        data: {
          admin: session.email,
          action: "setFees",
          payload: feesPayload
        }
      });
      await logAdminActivity({
        action: "fees_update",
        adminId: session.adminId,
        ...meta,
        metadata: feesPayload
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
        fees: feesPayload
      });
    }

    return NextResponse.json({
      success: true,
      mode: "client-submit",
      transaction: tx,
      fees: feesPayload
    });
  } catch (e) {
    return adminErrorResponse(e);
  }
}
