export type FeeUpdatePayload = {
  swapFeeBps: number;
  multisendFeeBps: number;
  stakingFeeBps: number;
  timestamp: number;
};

export function buildFeeUpdateMessage(payload: FeeUpdatePayload): string {
  return [
    "EasyFlow Admin",
    "Action: setFees",
    `SwapBps: ${payload.swapFeeBps}`,
    `MultisendBps: ${payload.multisendFeeBps}`,
    `StakingBps: ${payload.stakingFeeBps}`,
    `Timestamp: ${payload.timestamp}`
  ].join("\n");
}
