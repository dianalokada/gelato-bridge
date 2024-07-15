import { ethers, run, network } from "hardhat";

async function main() {
    const [deployer] = await ethers.getSigners();

    console.log("Deploying MockERC20 on ${network.name} with account:", deployer.address);

    // Deploying the MockERC20 contract
    const MockERC20Factory = await ethers.getContractFactory("MockERC20");
    const mockERC20 = await MockERC20Factory.deploy(deployer.address);

    await mockERC20.waitForDeployment();

    const contractAddress = await mockERC20.getAddress();
    console.log("MockERC20 deployed to:", contractAddress);
    console.log("Constructor arguments:", [deployer.address]);

    // Log verification instructions
    const explorerUrl = getExplorerUrl();
    if (explorerUrl) {
        console.log(`Please verify this contract manually on ${explorerUrl}`);
    } else {
        console.log("Unknown network. Please verify the contract on the appropriate explorer.");
    }
}

function getExplorerUrl() {
    switch(network.name) {
        case 'arbitrumSepolia':
            return 'https://sepolia.arbiscan.io';
        case 'optimismSepolia':
            return 'https://sepolia-optimism.etherscan.io';
        default:
            return '';
    }
}

// to handle errors
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});