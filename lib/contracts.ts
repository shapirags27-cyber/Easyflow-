import type { Address } from "viem";

export type ContractAddresses = {
  pointsManager: Address;
  protocolFees: Address;
  multiSend: Address;
  staking: Address;
  ammFactory: Address;
  ammRouter: Address;
};

export const contracts: ContractAddresses = {
  pointsManager: "0x7eF09627A6F03784517b6fa7F7A0996C10ee6eA1",
  protocolFees: "0x7F2EcE7D8A497a7A53a11475C082D02a1906b3cE",
  multiSend: "0x159aE33fCf6449949F04C2B6c29507Daf80d9681",
  staking: "0xD4164489C94970b1764eb23f2383c2ab237e3FEE",
  ammFactory: "0xaF58dBAC144DEC9273AcE4e3a69F70333b7feA5B",
  ammRouter: "0xB489bce5c9c9364da2D1D1Bc5CE4274F63141885"
};

