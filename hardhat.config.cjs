require("dotenv").config();
require("@nomicfoundation/hardhat-toolbox");

const PRIVATE_KEY = process.env.PRIVATE_KEY || "";

/** @type {import("hardhat/config").HardhatUserConfig} */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: { optimizer: { enabled: true, runs: 200 }, viaIR: true }
  },
  networks: {
    iopnTestnet: {
      url: "https://testnet-rpc.iopn.tech",
      chainId: 984,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : []
    }
  }
};

