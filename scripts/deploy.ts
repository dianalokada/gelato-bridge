import { ethers, run } from "hardhat";

async function main() {
    const [deployer] = await ethers.getSigners();

    console.log("Deploying MockERC20 with account:", deployer.address);

    // Deploying the MockERC20 contract
    const MockERC20Factory = await ethers.getContractFactory("MockERC20");
    const mockERC20 = await MockERC20Factory.deploy(deployer.address);

    await mockERC20.waitForDeployment();

    console.log("MockERC20 deployed to:", await mockERC20.getAddress());

    // Verify the contract if running on a supported network
    if (process.env.ETHERSCAN_API_KEY) {
        console.log("Verifying contract...");
        await verifyContract(await mockERC20.getAddress(), [deployer.address]);
    } else {
        console.log("Skipping contract verification. ETHERSCAN_API_KEY not set.");
    }
}

async function verifyContract(address: string, constructorArguments: any[]) {
    try {
        await run("verify:verify", {
            address: address,
            constructorArguments: constructorArguments,
        });
        console.log("Contract verified successfully");
    } catch (error) {
        console.error("Error verifying contract:", error);
    }
}

// to handle errors
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});