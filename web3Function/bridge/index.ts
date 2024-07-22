import {
  Web3Function,
  Web3FunctionEventContext,
  Web3FunctionResult,
} from '@gelatonetwork/web3-functions-sdk';
import { Contract, ethers, EventLog } from 'ethers';
import { GelatoRelay } from '@gelatonetwork/relay-sdk';
import { Interface } from "@ethersproject/abi";


// ABI for smart contract
const ABI = [
  'event TokensBurned(address indexed from, uint256 amount)',
];

// Initialize Gelato Relay for cross-chain transactions
const relay = new GelatoRelay();

// Define the main Web3Function
export const onRun = async (context: Web3FunctionEventContext): Promise<Web3FunctionResult> => {
  // async function retryRelay(relayFunction, maxRetries = 3) {
  //   for (let i = 0; i < maxRetries; i++) {
  //     try {
  //       return await relayFunction();
  //     } catch (error) {
  //       if (error.message.includes('Too many requests') && i < maxRetries - 1) {
  //         console.log(`Rate limited, retrying in ${2 ** i} seconds...`);
  //         await new Promise((resolve) => setTimeout(resolve, 1000 * 2 ** i));
  //       } else {
  //         throw error;
  //       }
  //     }
  //   }
  // }

  console.log('Starting onRun function');
  const { userArgs, secrets, log, gelatoArgs } = context;
   // Parse your event from ABI
   const token = new Interface(ABI);
   const event = token.parseLog(log);
   // Handle event data
  const { from, amount } = event.args;
  console.log(`burning event detected from ${from} ${amount} `);
  // Get api from secrets
  const gelatoApiKey = await secrets.get('GELATO_API_KEY');
  if (!gelatoApiKey) {
    return { canExec: false, message: `GELATO_API_KEY not set in secrets` };
  }
  // chainId: number
  const chainId = gelatoArgs.chainId;
   // Extract values from userArgs
   const arbitrumSepoliaRPC = userArgs.arbitrumSepoliaRPC as string;
   const optimismSepoliaRPC = userArgs.optimismSepoliaRPC as string;
   const contractAddressArbitrumSepolia = userArgs.contractAddressArbitrumSepolia as string;
   const contractAddressOptimismSepolia = userArgs.contractAddressOptimismSepolia as string;
   const arbitrumChainID = userArgs.arbitrumChainID as number;
   const optimismChainID = userArgs.optimismChainID as number;

  
  function getTargetChainId(sourceChainId: number): number {
    if (sourceChainId === arbitrumChainID) {
      return optimismChainID
    } else {
      return arbitrumChainID
    }
  }

  const targetContract = new Contract(
    "0x39C410eFE75DDfdBe4Be5455A7b368a533da15E1",
    [
      'function mintViaDedicatedAddress(address to, uint256 amount)'    
    ],
  )

  const mintCalldata = targetContract.interface.encodeFunctionData(
    'mintViaDedicatedAddress',
    [from, amount],
  );

  relay.sponsoredCall(
    {
      chainId: BigInt(getTargetChainId(gelatoArgs.chainId)),
      target: "0x39C410eFE75DDfdBe4Be5455A7b368a533da15E1",
      data: mintCalldata,
    },
    gelatoApiKey,
  );

  return { canExec: false, message: "Processed events and relayed transactions" }
}
  

  // // Get the dedicated address from secrets or user args
  // const dedicatedAddress =
  //   (await secrets.get('DEDICATED_ADDRESS')) || (userArgs.dedicatedAddress as string);
  // if (!dedicatedAddress) {
  //   return { canExec: false, message: 'Dedicated address not set in secrets or user args' };
  // }
  // console.log('Dedicated address:', dedicatedAddress);

//   // Validate that required configuration variables are defined
//   if (!contractAddressArbitrumSepolia) {
//     throw new Error('Arbitrum Sepolia contract address is not defined in userArgs');
//   }

//   if (!contractAddressOptimismSepolia) {
//     throw new Error('Optimism Sepolia contract address is not defined in userArgs');
//   }

//   try {
//     // Create providers for Arbitrum and Optimism Sepolia networks
//     const arbitrumProvider = new ethers.JsonRpcProvider(arbitrumSepoliaRPC);
//     const optimismProvider = new ethers.JsonRpcProvider(optimismSepoliaRPC);

//     // Create contract instances
//     const arbitrumContract = new Contract(
//       contractAddressArbitrumSepolia as string,
//       ABI,
//       arbitrumProvider,
//     );
//     const optimismContract = new Contract(
//       contractAddressOptimismSepolia as string,
//       ABI,
//       optimismProvider,
//     );

//     const processEvents = async (
//       sourceContract: Contract, // The contract to listen for events on
//       targetContract: Contract, // The target Contract
//       targetChainId: bigint, // The chain ID of the target network
//       targetAddress: string, // The address of the target contract
//     ) => {
//       console.log('Processing events for chain ID:', targetChainId.toString());
//       const startBlock = -10000;
//       // Create a filter for TokensBurned events
//       const filter = sourceContract.filters.TokensBurned();
//       // Queries the last blockchain for TokensBurned events
//       const events = await sourceContract.queryFilter(filter, startBlock, 'latest');
//       console.log('Number of events found:', events.length);
//       //when the transaction is detected, the web3function processes it and triggers a  mint on the other chain
//       if (events.length > 0) {
//         // Sort events by block number in descending order
//         const sortedEvents = events.sort((a, b) => b.blockNumber - a.blockNumber);

//         // Get the most recent event
//         const latestEvent = sortedEvents[0];

//         if (latestEvent instanceof EventLog && latestEvent.args) {
//           const [from, amount] = latestEvent.args;
//           const mintCalldata = targetContract.interface.encodeFunctionData(
//             'mintViaDedicatedAddress',
//             [from, amount],
//           );

//           try {
//             //the ttransaction is relayed to the target chain using gelato's sponsoredcall
//             console.log('Calling relay.sponsoredCall');
//             const relayResponse = await retryRelay(() =>
//               relay.sponsoredCall(
//                 {
//                   chainId: targetChainId,
//                   target: targetAddress,
//                   data: mintCalldata,
//                 },
//                 gelatoApiKey,
//               ),
//             );
//             console.log(`Relay response: ${relayResponse.taskId}`);
//           } catch (error) {
//             console.error('Error relaying transaction:', error);
//           }
//         }
//       }
//     };
//     //the function processevents is called for both chains,making sure that a burn on one chain triggers a mint on the other chain 
//     await processEvents(
//       arbitrumContract,
//       optimismContract,
//       BigInt(11155420),
//       contractAddressOptimismSepolia as string,
//     ); // Optimism Sepolia chain ID
//     await processEvents(
//       optimismContract,
//       arbitrumContract,
//       BigInt(421614),
//       contractAddressArbitrumSepolia as string,
//     ); // Arbitrum Sepolia chain ID

//     return { canExec: false, message: 'Processed events and relayed transactions' };
//   } catch (error) {
//     console.error('Error in Web3 Function:', error);
//     return { canExec: false, message: `Error occurred: ${(error as Error).message}` };
//   }
// };

//pass the onRun function to the Web3Function.onRun method
Web3Function.onRun(onRun);