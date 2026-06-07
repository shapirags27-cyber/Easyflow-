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
  pointsManager: "0x7eF09627A6F03784517b6fa7F7A0996C10ee6eA1",
  protocolFees: "0x7F2EcE7D8A497a7A53a11475C082D02a1906b3cE",
  multiSend: "0x159aE33fCf6449949F04C2B6c29507Daf80d9681",
  staking: "0xD4164489C94970b1764eb23f2383c2ab237e3FEE",
  tokenA: "0x2E9e88e3816324d2697fD8B523e0062B55d779d0",
  tokenB: "0x1A07f1061a63C7b3D6d320b70f93003946720182",
  ammFactory: "0xaF58dBAC144DEC9273AcE4e3a69F70333b7feA5B",
  ammRouter: "0x6ba48dFE979Db3b77AA5581852A0E077695a0E93"
};

