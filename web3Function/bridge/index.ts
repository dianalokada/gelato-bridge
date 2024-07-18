import {
  Web3Function,
  Web3FunctionContext,
  Web3FunctionResult,
} from '@gelatonetwork/web3-functions-sdk';
import { Contract, ethers, EventLog } from 'ethers';
import { GelatoRelay } from '@gelatonetwork/relay-sdk';

// ABI for smart contract
const ABI = [
  'event TokensMinted(address indexed to, uint256 amount)',
  'event TokensBurned(address indexed from, uint256 amount)',
  'function mintViaDedicatedAddress(address to, uint256 amount)',
  'function burn(uint256 amount)',
  'function mintToAdmin(uint256 amount)',
  'function setDedicatedAddress(address _dedicatedAddress)',
];

// Initialize Gelato Relay for cross-chain transactions
const relay = new GelatoRelay();

// Define the main Web3Function
export const onRun = async (context: Web3FunctionContext): Promise<Web3FunctionResult> => {
  console.log('Starting onRun function');
  const { userArgs, secrets } = context;
  console.log('User args:', JSON.stringify(userArgs));
  // Extract values from userArgs
  const arbitrumSepoliaRPC = userArgs.arbitrumSepoliaRPC as string;
  const optimismSepoliaRPC = userArgs.optimismSepoliaRPC as string;
  const contractAddressArbitrumSepolia = userArgs.contractAddressArbitrumSepolia as string;
  const contractAddressOptimismSepolia = userArgs.contractAddressOptimismSepolia as string;
  console.log('RPC URLs:', { arbitrumSepoliaRPC, optimismSepoliaRPC });
  console.log('Contract addresses:', {
    contractAddressArbitrumSepolia,
    contractAddressOptimismSepolia,
  });
  // Get api from secrets
  const gelatoApiKey = await secrets.get('GELATO_API_KEY');
  if (!gelatoApiKey) {
    return { canExec: false, message: `GELATO_API_KEY not set in secrets` };
  }

  // Validate that required configuration variables are defined
  if (!contractAddressArbitrumSepolia) {
    throw new Error('Arbitrum Sepolia contract address is not defined in userArgs');
  }

  if (!contractAddressOptimismSepolia) {
    throw new Error('Optimism Sepolia contract address is not defined in userArgs');
  }

  try {
    console.log('Creating providers');
    // Create providers for Arbitrum and Optimism Sepolia networks
    const arbitrumProvider = new ethers.JsonRpcProvider(arbitrumSepoliaRPC);
    const optimismProvider = new ethers.JsonRpcProvider(optimismSepoliaRPC);

    console.log('Creating contract instances');
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
      console.log('Processing events for chain ID:', targetChainId.toString());
      // Create a filter for TokensBurned events
      const filter = sourceContract.filters.TokensBurned();
      // Query the last 1000 blocks for TokensBurned events
      console.log('Querying events');
      const events = await sourceContract.queryFilter(filter, -1000, 'latest');
      console.log('Number of events found:', events.length);

      // Iterate through each event found
      for (const event of events) {
        console.log('EVENT', event);

        // Check if the event is an EventLog and has arguments
        if (event instanceof EventLog && event.args) {
          // Destructure the 'from' address and 'amount' from the event args
          const [from, amount] = event.args;
          // Encode the function call data for the mint function on the target contract
          const mintCalldata = targetContract.interface.encodeFunctionData(
            'mintViaDedicatedAddress',
            [from, amount],
          );

          try {
            console.log('Calling relay.sponsoredCall');
            const relayResponse = await relay.sponsoredCall(
              {
                chainId: targetChainId,
                target: targetAddress,
                data: mintCalldata,
              },
              gelatoApiKey,
            );
            console.log(`Relay response: ${relayResponse.taskId}`);
          } catch (error) {
            console.error('Error relaying transaction:', error);
          }
        }
      }
    };

    console.log('Processing Arbitrum events');
    await processEvents(
      arbitrumContract,
      optimismContract,
      BigInt(11155420),
      contractAddressOptimismSepolia as string,
    ); // Optimism Sepolia chain ID
    console.log('Processing Optimism events');
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
