import hre from "hardhat";

const { ethers } = hre;

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  const admin = process.env.ADMIN_ADDRESS ?? deployer.address;
  console.log("Admin:", admin);

  const isAdminDeployer = admin.toLowerCase() === deployer.address.toLowerCase();

  const ProtocolFees = await ethers.getContractFactory("ProtocolFees");
  const protocolFees = await ProtocolFees.deploy(admin, admin);
  await protocolFees.waitForDeployment();

  const PointsManager = await ethers.getContractFactory("PointsManager");
  const points = await PointsManager.deploy(admin);
  await points.waitForDeployment();

  const MockERC20 = await ethers.getContractFactory("MockERC20");
  const tokenA = await MockERC20.deploy("EasyFlow Token A", "A", 18, admin);
  const tokenB = await MockERC20.deploy("EasyFlow Token B", "B", 18, admin);
  await tokenA.waitForDeployment();
  await tokenB.waitForDeployment();

  const AMMFactory = await ethers.getContractFactory("AMMFactory");
  const factory = await AMMFactory.deploy(await protocolFees.getAddress());
  await factory.waitForDeployment();

  const Router = await ethers.getContractFactory("Router");
  const router = await Router.deploy(
    await factory.getAddress(),
    await points.getAddress(),
    await protocolFees.getAddress()
  );
  await router.waitForDeployment();

  const OPNStaking = await ethers.getContractFactory("OPNStaking");
  const staking = await OPNStaking.deploy(
    await tokenA.getAddress(),
    await points.getAddress(),
    await protocolFees.getAddress()
  );
  await staking.waitForDeployment();

  const MultiSend = await ethers.getContractFactory("MultiSend");
  const multisend = await MultiSend.deploy(
    await points.getAddress(),
    await protocolFees.getAddress()
  );
  await multisend.waitForDeployment();

  if (isAdminDeployer) {
    await (await points.setModule(await router.getAddress(), true)).wait();
    await (await points.setModule(await staking.getAddress(), true)).wait();
    await (await points.setModule(await multisend.getAddress(), true)).wait();
  } else {
    console.log(
      "Skipping points.setModule because deployer != admin. Run setModule from admin wallet after deploy."
    );
  }

  const seed = ethers.parseUnits("100000", 18);
  const liqA = ethers.parseUnits("10000", 18);
  const liqB = ethers.parseUnits("10000", 18);

  if (isAdminDeployer) {
    await (await tokenA.mint(deployer.address, seed)).wait();
    await (await tokenB.mint(deployer.address, seed)).wait();
    await (await tokenA.approve(await router.getAddress(), seed)).wait();
    await (await tokenB.approve(await router.getAddress(), seed)).wait();
    await (
      await router.addLiquidity(
        await tokenA.getAddress(),
        await tokenB.getAddress(),
        liqA,
        liqB,
        deployer.address
      )
    ).wait();
  } else {
    console.log(
      "Skipping token mints and addLiquidity because deployer != admin. Mint + addLiquidity from admin wallet after deploy."
    );
  }

  const addresses = {
    protocolFees: await protocolFees.getAddress(),
    pointsManager: await points.getAddress(),
    multiSend: await multisend.getAddress(),
    staking: await staking.getAddress(),
    tokenA: await tokenA.getAddress(),
    tokenB: await tokenB.getAddress(),
    ammFactory: await factory.getAddress(),
    ammRouter: await router.getAddress()
  };

  console.log("Deployed addresses:", JSON.stringify(addresses, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
