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

  console.log('Starting onRun function');
  const { userArgs, secrets, log, gelatoArgs } = context;
  if(log){
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
} else {
  console.log('No log data available');
  return { canExec: false, message: 'No log data available' };
}
}
//pass the onRun function to the Web3Function.onRun method
Web3Function.onRun(onRun);