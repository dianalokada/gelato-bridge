import {
  Web3Function,
  Web3FunctionContext,
  Web3FunctionResult,
} from '@gelatonetwork/web3-functions-sdk';
import { Contract, ethers, EventLog } from 'ethers';
import { GelatoRelay } from '@gelatonetwork/relay-sdk';
import {
  arbitrumSepoliaRPC,
  optimismSepoliaRPC,
  gelatoApiKey,
  contractAddressArbitrumSepolia,
  contractAddressOptimismSepolia,
} from '../config';

// Validate that required configuration variables are defined
if (!contractAddressArbitrumSepolia) {
  throw new Error('Arbitrum Sepolia contract address is not defined in the config');
}

if (!contractAddressOptimismSepolia) {
  throw new Error('Optimism Sepolia contract address is not defined in the config');
}

// Define the ABI for smart contract
const ABI = [
  'event TokensMinted(address indexed to, uint256 amount)',
  'event TokensBurned(address indexed from, uint256 amount)',
  'function mint(address to, uint256 amount)',
];

// Initialize Gelato Relay for cross-chain transactions
const relay = new GelatoRelay();

// Define the main Web3Function
export const onRun = async (context: Web3FunctionContext): Promise<Web3FunctionResult> => {
  try {
    // Create providers for Arbitrum and Optimism Sepolia networks
    const arbitrumProvider = new ethers.JsonRpcProvider(arbitrumSepoliaRPC);
    const optimismProvider = new ethers.JsonRpcProvider(optimismSepoliaRPC);

    // Create contract instances
    const arbitrumContract = new Contract(
      contractAddressArbitrumSepolia as string,
      ABI,
      arbitrumProvider,
    );
    const optimismContract = new Contract(
      contractAddressOptimismSepolia as string,
      ABI,
      optimismProvider,
    );

    const processEvents = async (
      sourceContract: Contract, // The contract to listen for events on
      targetContract: Contract, // The target Contract
      targetChainId: bigint, // The chain ID of the target network
      targetAddress: string, // The address of the target contract
    ) => {
      // Create a filter for TokensBurned events
      const filter = sourceContract.filters.TokensBurned();
      // Query the last 1000 blocks for TokensBurned events
      const events = await sourceContract.queryFilter(filter, -1000, 'latest');

      // Iterate through each event found
      for (const event of events) {
        // Check if the event is an EventLog and has arguments
        if (event instanceof EventLog && event.args) {
          // Destructure the 'from' address and 'amount' from the event args
          const [from, amount] = event.args;
          // Encode the function call data for the mint function on the target contract
          const mintCalldata = targetContract.interface.encodeFunctionData('mint', [from, amount]);

          try {
            const relayResponse = await relay.sponsoredCall(
              {
                chainId: targetChainId,
                target: targetAddress,
                data: mintCalldata,
              },
              gelatoApiKey as string,
            );
            console.log(`Relay response: ${relayResponse.taskId}`);
          } catch (error) {
            console.error('Error relaying transaction:', error);
          }
        }
      }
    };

    await processEvents(
      arbitrumContract,
      optimismContract,
      BigInt(11155420),
      contractAddressOptimismSepolia as string,
    ); // Optimism Sepolia chain ID
    await processEvents(
      optimismContract,
      arbitrumContract,
      BigInt(421614),
      contractAddressArbitrumSepolia as string,
    ); // Arbitrum Sepolia chain ID

    return { canExec: false, message: 'Processed events and relayed transactions' };
  } catch (error) {
    console.error('Error in Web3 Function:', error);
    return { canExec: false, message: `Error occurred: ${(error as Error).message}` };
  }
};

//pass the onRun function to the Web3Function.onRun method
Web3Function.onRun(onRun);
