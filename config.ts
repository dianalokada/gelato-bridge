import dotenv from 'dotenv';
dotenv.config();

// RPC URLs
const arbitrumSepoliaRPC = process.env.ARBITRUM_SEPOLIA_RPC_URL;
const optimismSepoliaRPC = process.env.OPTIMISM_SEPOLIA_RPC_URL;

// Private key
const privateKey = process.env.PRIVATE_KEY;

// Contract addresses
const contractAddressArbitrumSepolia = process.env.CONTRACT_ADDRESS_ARBITRUM_SEPOLIA;
const contractAddressOptimismSepolia = process.env.CONTRACT_ADDRESS_OPTIMISM_SEPOLIA;

// API keys for contract verification
const arbiscanApiKey = process.env.ARBISCAN_API_KEY;
const optimismApiKey = process.env.OPTIMISM_API_KEY;

// Gelato specific
const gelatoApiKey = process.env.GELATO_API_KEY;

// Error checking
if (!privateKey) {
  throw new Error('Private key is not set in the environment variables');
}

if (!contractAddressArbitrumSepolia || !contractAddressOptimismSepolia) {
  console.warn(
    'One or both contract addresses are not set. Make sure to deploy your contracts and update the .env file',
  );
}

// Export the variables so they can be used in other parts of your application
export {
  arbitrumSepoliaRPC,
  optimismSepoliaRPC,
  privateKey,
  contractAddressArbitrumSepolia,
  contractAddressOptimismSepolia,
  arbiscanApiKey,
  optimismApiKey,
  gelatoApiKey,
};
