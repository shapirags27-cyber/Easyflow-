"use client";

import * as React from "react";
import { formatUnits, parseUnits, type Address } from "viem";
import { useAccount, useBalance, useReadContract } from "wagmi";
import { iopnTestnet } from "@/lib/chains";
import { erc20Abi } from "@/lib/abis";
import {
  isWopnAddress,
  OPNV2_ADDRESS,
  TUSDT_ADDRESS,
  WOPN_ADDRESS
} from "@/lib/tokens";

export type MarketAsset = {
  symbol: string;
  address: Address;
  supplyApy: string;
  borrowApy: string;
};

export const LEND_MARKETS: MarketAsset[] = [
  { symbol: "OPN", address: WOPN_ADDRESS, supplyApy: "8.2%", borrowApy: "12.4%" },
  { symbol: "OPNV2", address: OPNV2_ADDRESS, supplyApy: "7.5%", borrowApy: "11.2%" },
  { symbol: "tUSDT", address: TUSDT_ADDRESS, supplyApy: "5.1%", borrowApy: "9.8%" }
];

type StoredPosition = {
  supplied: Record<string, string>;
  borrowed: Record<string, string>;
};

function storageKey(wallet: string) {
  return `easyflow-lend-${wallet.toLowerCase()}`;
}

function loadPosition(wallet: string): StoredPosition {
  if (typeof window === "undefined") return { supplied: {}, borrowed: {} };
  try {
    const raw = localStorage.getItem(storageKey(wallet));
    if (!raw) return { supplied: {}, borrowed: {} };
    return JSON.parse(raw) as StoredPosition;
  } catch {
    return { supplied: {}, borrowed: {} };
  }
}

function savePosition(wallet: string, pos: StoredPosition) {
  localStorage.setItem(storageKey(wallet), JSON.stringify(pos));
}

function useAssetBalance(address: Address, wallet?: Address) {
  const isOpn = isWopnAddress(address);

  const { data: nativeBal } = useBalance({
    address: wallet,
    chainId: iopnTestnet.id,
    query: { enabled: Boolean(wallet && isOpn) }
  });

  const { data: erc20Bal } = useReadContract({
    address,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: wallet ? [wallet] : undefined,
    query: { enabled: Boolean(wallet) }
  });

  const { data: decimals } = useReadContract({
    address,
    abi: erc20Abi,
    functionName: "decimals",
    query: { enabled: Boolean(wallet) }
  });

  const raw = isOpn
    ? (erc20Bal ?? 0n) + (nativeBal?.value ?? 0n)
    : (erc20Bal ?? 0n);

  return {
    raw,
    decimals: decimals ? Number(decimals) : 18,
    formatted: formatUnits(raw, decimals ? Number(decimals) : 18)
  };
}

export function useBorrowMarkets() {
  const { address, isConnected } = useAccount();
  const [position, setPosition] = React.useState<StoredPosition>({
    supplied: {},
    borrowed: {}
  });
  const [status, setStatus] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!address) {
      setPosition({ supplied: {}, borrowed: {} });
      return;
    }
    setPosition(loadPosition(address));
  }, [address]);

  const opnBal = useAssetBalance(WOPN_ADDRESS, address);
  const opnv2Bal = useAssetBalance(OPNV2_ADDRESS, address);
  const tusdtBal = useAssetBalance(TUSDT_ADDRESS, address);

  const balances: Record<string, { raw: bigint; decimals: number; formatted: string }> = {
    OPN: opnBal,
    OPNV2: opnv2Bal,
    tUSDT: tusdtBal
  };

  const totalSuppliedOpn = React.useMemo(() => {
    let sum = 0;
    for (const m of LEND_MARKETS) {
      const amt = position.supplied[m.symbol] ?? "0";
      sum += Number(amt) || 0;
    }
    return sum;
  }, [position.supplied]);

  const totalBorrowedOpn = React.useMemo(() => {
    let sum = 0;
    for (const m of LEND_MARKETS) {
      const amt = position.borrowed[m.symbol] ?? "0";
      sum += Number(amt) || 0;
    }
    return sum;
  }, [position.borrowed]);

  const healthFactor =
    totalBorrowedOpn > 0 ? Math.max(0.1, totalSuppliedOpn / totalBorrowedOpn) : 9.99;

  const borrowPower = totalSuppliedOpn * 0.7;

  const persist = React.useCallback(
    (next: StoredPosition) => {
      if (!address) return;
      setPosition(next);
      savePosition(address, next);
    },
    [address]
  );

  const supply = React.useCallback(
    (symbol: string, amount: string) => {
      if (!address) return;
      setError(null);
      setStatus(null);

      const bal = balances[symbol];
      if (!bal) {
        setError("Unknown asset.");
        return;
      }

      let amountWei: bigint;
      try {
        amountWei = parseUnits(amount || "0", bal.decimals);
      } catch {
        setError("Invalid amount.");
        return;
      }

      if (amountWei === 0n) {
        setError("Enter an amount greater than zero.");
        return;
      }

      if (bal.raw < amountWei) {
        setError(`Insufficient ${symbol} balance.`);
        return;
      }

      const current = Number(position.supplied[symbol] ?? "0");
      const nextAmt = current + Number(amount);
      persist({
        ...position,
        supplied: { ...position.supplied, [symbol]: String(nextAmt) }
      });
      setStatus(`Supplied ${amount} ${symbol}. On-chain lending contracts coming soon — position saved locally.`);
    },
    [address, balances, persist, position]
  );

  const borrow = React.useCallback(
    (symbol: string, amount: string) => {
      if (!address) return;
      setError(null);
      setStatus(null);

      const amt = Number(amount || "0");
      if (!Number.isFinite(amt) || amt <= 0) {
        setError("Enter an amount greater than zero.");
        return;
      }

      if (totalSuppliedOpn === 0) {
        setError("Supply collateral before borrowing.");
        return;
      }

      const newBorrowed = totalBorrowedOpn + amt;
      if (newBorrowed > borrowPower) {
        setError(`Exceeds borrow power (${borrowPower.toFixed(2)} OPN equivalent).`);
        return;
      }

      const current = Number(position.borrowed[symbol] ?? "0");
      persist({
        ...position,
        borrowed: { ...position.borrowed, [symbol]: String(current + amt) }
      });
      setStatus(`Borrowed ${amount} ${symbol}. On-chain lending contracts coming soon — position saved locally.`);
    },
    [address, borrowPower, persist, position, totalBorrowedOpn, totalSuppliedOpn]
  );

  const getBalance = (symbol: string) => balances[symbol]?.formatted ?? "0";

  return {
    markets: LEND_MARKETS,
    isConnected,
    totalSuppliedOpn,
    totalBorrowedOpn,
    borrowPower,
    healthFactor,
    supply,
    borrow,
    getBalance,
    status,
    error,
    clearMessages: () => {
      setStatus(null);
      setError(null);
    }
  };
}
