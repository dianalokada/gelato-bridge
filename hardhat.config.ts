import { HardhatUserConfig } from 'hardhat/config';
import '@nomicfoundation/hardhat-chai-matchers';
import '@gelatonetwork/web3-functions-sdk/hardhat-plugin';
import '@nomicfoundation/hardhat-ethers';
import '@nomicfoundation/hardhat-toolbox';
import dotenv from 'dotenv';

dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: '0.8.20',
      },
      {
        version: '0.8.19',
      },
    ],
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    arbitrumSepolia: {
      url: process.env.ARBITRUM_SEPOLIA_RPC_URL,
      accounts: [process.env.PRIVATE_KEY!],
    },
    optimismSepolia: {
      url: process.env.OPTIMISM_SEPOLIA_RPC_URL,
      accounts: [process.env.PRIVATE_KEY!],
      chainId: 11155420, // Optimism Sepolia chain ID
    },
  },
  etherscan: {
    apiKey: {
      sepolia: process.env.ETHERSCAN_API_KEY!,
      optimismSepolia: process.env.OPTIMISM_API_KEY!,
    },
    customChains: [
      {
        network: 'optimismSepolia',
        chainId: 11155420,
        urls: {
          apiURL: 'https://api-sepolia-optimism.etherscan.io/api',
          browserURL: 'https://sepolia-optimism.etherscan.io/',
        },
      },
    ],
  },
  w3f: {
    rootDir: './web3Function',
    debug: false,
    networks: ['arbitrumSepolia', 'optimismSepolia'],
  },
};

export default config;
