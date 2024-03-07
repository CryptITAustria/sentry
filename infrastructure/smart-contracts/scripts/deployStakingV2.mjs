import hardhat from "hardhat";
const { ethers, upgrades } = hardhat;
import { esXaiAbi } from "@sentry/core";
import { safeVerify } from "../utils/safeVerify.mjs";

const refereeAddress = "0xfD41041180571C5D371BEA3D9550E55653671198";
const esXaiAddress = "0x4C749d097832DE2FEcc989ce18fDc5f1BD76700c";

async function main() {
    const [deployer] = (await ethers.getSigners());
    const deployerAddress = await deployer.getAddress();
    console.log("Deployer address", deployerAddress);

    //DEPLOY POOL IMPL
    console.log("Deploying StakingPool implementation...");
    const StakingPool = await ethers.deployContract("StakingPool");
    await StakingPool.waitForDeployment();
    const poolImplAddress = await StakingPool.getAddress();

    // //DEPLOY BUCKET TRACKER IMPL
    console.log("Deploying BucketTracker implementation...");
    const BucketTracker = await ethers.deployContract("BucketTracker");
    await BucketTracker.waitForDeployment();
    const bucketImplAddress = await BucketTracker.getAddress();

    console.log("Deploying PoolFactory Upgradable...");
    const PoolFactory = await ethers.getContractFactory("PoolFactory");
    const poolFactory = await upgrades.deployProxy(PoolFactory, [refereeAddress, esXaiAddress, deployerAddress, poolImplAddress, bucketImplAddress], { kind: "transparent", deployer });
    const tx = await poolFactory.deploymentTransaction();
    await tx.wait(3);
    const poolFactoryAddress = await poolFactory.getAddress();
    console.log("PoolFactory deployed to:", poolFactoryAddress);

    //Upgrade the referee
    const referee = await ethers.getContractFactory("Referee5");
    console.log("Got factory");
    await upgrades.upgradeProxy(refereeAddress, referee, { call: { fn: "initialize", args: [poolFactoryAddress] } });
    console.log("Upgraded");

    //Give PoolFactory auth to whitelist new pools & buckets on esXai
    const esXai = await new ethers.Contract(esXaiAddress, esXaiAbi, deployer);
    const esXaiAdminRole = await esXai.DEFAULT_ADMIN_ROLE();
    await esXai.grantRole(esXaiAdminRole, poolFactoryAddress);

    await safeVerify({ contract: poolFactory });

    await run("verify:verify", {
        address: refereeAddress,
        constructorArguments: [],
        contract: "Referee5"
    });

    await run("verify:verify", {
        address: bucketImplAddress,
        constructorArguments: [],
    });

    await run("verify:verify", {
        address: poolImplAddress,
        constructorArguments: [],
    });

    console.log("verified")
}


// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});