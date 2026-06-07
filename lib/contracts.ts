import type { Address } from "viem";

export type ContractAddresses = {
  pointsManager: Address;
  protocolFees: Address;
  multiSend: Address;
  staking: Address;
  tokenA: Address;
  tokenB: Address;
  ammFactory: Address;
  ammRouter: Address;
};

// Populated by scripts/deploy.ts. Replace after deploying.
export const contracts: ContractAddresses = {
  pointsManager: "0x0000000000000000000000000000000000000000",
  protocolFees: "0x0000000000000000000000000000000000000000",
  multiSend: "0x0000000000000000000000000000000000000000",
  staking: "0x0000000000000000000000000000000000000000",
  tokenA: "0x0000000000000000000000000000000000000000",
  tokenB: "0x0000000000000000000000000000000000000000",
  ammFactory: "0x0000000000000000000000000000000000000000",
  ammRouter: "0x0000000000000000000000000000000000000000"
};

