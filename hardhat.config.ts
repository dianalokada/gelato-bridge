import { HardhatUserConfig } from "hardhat/config";
import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-waffle";
import "@nomicfoundation/hardhat-toolbox";
import dotenv from "dotenv";

dotenv.config();

const config: HardhatUserConfig = {
  solidity: "0.8.24",
  networks: {
    arbitrumSepolia: {
      url: process.env.ARBITRUM_SEPOLIA_RPC_URL,
      accounts: [process.env.PRIVATE_KEY!]
    },
    optimismSepolia: {
      url: process.env.OPTIMISM_SEPOLIA_RPC_URL,
      accounts: [process.env.PRIVATE_KEY!]
    }
  }
};

export default config;
