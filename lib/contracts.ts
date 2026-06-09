import type { Address } from "viem";

export type ContractAddresses = {
  pointsManager: Address;
  protocolFees: Address;
  multiSend: Address;
  staking: Address;
  ammFactory: Address;
  ammRouter: Address;
};

function publicAddress(envKey: string, fallback: Address): Address {
  const value = process.env[envKey]?.trim();
  if (value && /^0x[a-fA-F0-9]{40}$/.test(value)) return value as Address;
  return fallback;
}

const AMM_ROUTER = publicAddress(
  "NEXT_PUBLIC_AMM_ROUTER_ADDRESS",
  "0xB489bce5c9c9364da2D1D1Bc5CE4274F63141885"
);

const AMM_FACTORY = publicAddress(
  "NEXT_PUBLIC_AMM_FACTORY_ADDRESS",
  "0x8860242B65611dfd077aEe26C3C7920813dF9208"
);

export const STAKING_TOKEN_SYMBOL =
  process.env.NEXT_PUBLIC_STAKING_TOKEN_SYMBOL ?? "OPN";

export const contracts: ContractAddresses = {
  pointsManager: "0x7eF09627A6F03784517b6fa7F7A0996C10ee6eA1",
  protocolFees: "0x7F2EcE7D8A497a7A53a11475C082D02a1906b3cE",
  multiSend: "0x159aE33fCf6449949F04C2B6c29507Daf80d9681",
  staking: "0xD4164489C94970b1764eb23f2383c2ab237e3FEE",
  ammFactory: AMM_FACTORY,
  ammRouter: AMM_ROUTER
};

