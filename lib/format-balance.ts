import { formatUnits } from "viem";

type BalanceLike = {
  value: bigint;
  decimals: number;
  symbol: string;
};

export function formatBalanceAmount(balance?: BalanceLike | null, digits = 2) {
  if (!balance) return null;
  return Number(formatUnits(balance.value, balance.decimals)).toFixed(digits);
}
