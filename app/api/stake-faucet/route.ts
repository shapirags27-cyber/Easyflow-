import { NextResponse } from "next/server";
import { isAddress, parseUnits, type Address, type Hex } from "viem";
import { createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { iopnTestnet } from "@/lib/chains";
import { mockErc20Abi, stakingAbi } from "@/lib/abis";
import { contracts } from "@/lib/contracts";
import { getPublicClient } from "@/lib/server/chain";

const FAUCET_AMOUNT = parseUnits("1000", 18);

export async function POST(req: Request) {
  const body = (await req.json()) as { wallet?: string };
  const wallet = body.wallet;

  if (!wallet || !isAddress(wallet)) {
    return NextResponse.json({ error: "Invalid wallet address" }, { status: 400 });
  }

  const pk = process.env.STAKE_FAUCET_PRIVATE_KEY ?? process.env.ADMIN_PRIVATE_KEY;
  if (!pk) {
    return NextResponse.json(
      {
        error:
          "Staking faucet is not configured. Ask the admin to mint staking pool tokens to your wallet."
      },
      { status: 503 }
    );
  }

  try {
    const client = getPublicClient();
    const stakingToken = await client.readContract({
      address: contracts.staking,
      abi: stakingAbi,
      functionName: "stakingToken"
    });

    const account = privateKeyToAccount(pk as Hex);
    const walletClient = createWalletClient({
      account,
      chain: iopnTestnet,
      transport: http(iopnTestnet.rpcUrls.default.http[0])
    });

    const hash = await walletClient.writeContract({
      address: stakingToken as Address,
      abi: mockErc20Abi,
      functionName: "mint",
      args: [wallet as Address, FAUCET_AMOUNT]
    });

    return NextResponse.json({
      ok: true,
      hash,
      amount: FAUCET_AMOUNT.toString(),
      token: stakingToken
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Faucet mint failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
