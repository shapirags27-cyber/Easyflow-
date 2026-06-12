require("dotenv").config();
const hre = require("hardhat");

const WOPN = "0xBc022C9dEb5AF250A526321d16Ef52E39b4DBD84";
const POINTS_MANAGER = "0x7eF09627A6F03784517b6fa7F7A0996C10ee6eA1";
const PROTOCOL_FEES = "0x7F2EcE7D8A497a7A53a11475C082D02a1906b3cE";

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deployer:", deployer.address);

  const OPNStaking = await hre.ethers.getContractFactory("OPNStaking");
  const staking = await OPNStaking.deploy(WOPN, POINTS_MANAGER, PROTOCOL_FEES);
  await staking.waitForDeployment();
  const stakingAddress = await staking.getAddress();
  console.log("WOPN staking deployed:", stakingAddress);

  const points = await hre.ethers.getContractAt("PointsManager", POINTS_MANAGER);
  const tx = await points.setModule(stakingAddress, true);
  await tx.wait();
  console.log("Registered staking module on PointsManager");

  console.log(
    JSON.stringify(
      {
        staking: stakingAddress,
        stakingToken: WOPN,
        pointsManager: POINTS_MANAGER,
        protocolFees: PROTOCOL_FEES
      },
      null,
      2
    )
  );
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
