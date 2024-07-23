import {
  Web3Function,
  Web3FunctionEventContext
} from '@gelatonetwork/web3-functions-sdk';
import { Contract } from 'ethers';
import { GelatoRelay } from '@gelatonetwork/relay-sdk';
import { Interface } from '@ethersproject/abi';

// ABI for smart contract
const ABI = ['event TokensBurned(address indexed from, uint256 amount)'];

// Initialize Gelato Relay for cross-chain transactions
const relay = new GelatoRelay();

// Define the main Web3Function
Web3Function.onRun(async (context: Web3FunctionEventContext) => {
    console.log('Starting onRun function');
  const { userArgs, secrets, log, gelatoArgs } = context;

  if (!log) {
    console.log('No log data available');
    return { canExec: false, message: 'No log data available' };
  }

  try {
    // Parse your event from ABI
    const token = new Interface(ABI);
    const event = token.parseLog(log);
    // Handle event data
    const { from, amount } = event.args;

    console.log(`Burning event detected from ${from}`);

    // Get api from secrets
    const gelatoApiKey = await secrets.get('GELATO_API_KEY');
    if (!gelatoApiKey) {
      return { canExec: false, message: `GELATO_API_KEY not set in secrets` };
    }

    const arbitrumChainID = Number(userArgs.arbitrumChainID);
    const optimismChainID = Number(userArgs.optimismChainID);

    let sourceChainId = Number(gelatoArgs.chainId);
    console.log('Source Chain ID from gelatoArgs:', sourceChainId);

    // Check if the sourceChainId is one of the expected chain IDs
    if (sourceChainId !== arbitrumChainID && sourceChainId !== optimismChainID) {
      console.log('Unexpected source chain ID. Defaulting to Arbitrum Sepolia.');
      sourceChainId = arbitrumChainID;
    }

    function getTargetChainId(sourceChainId: number): number {
      console.log('getTargetChainId input:', sourceChainId);
      if (sourceChainId === arbitrumChainID) {
        return optimismChainID;
      } else if (sourceChainId === optimismChainID) {
        return arbitrumChainID;
      } else {
        console.log('Unexpected sourceChainId. Defaulting to Optimism Sepolia.');
        return optimismChainID;
      }
    }

    const targetChainId = getTargetChainId(sourceChainId);
    // console.log('Target Chain ID:', targetChainId);

    const targetContract = new Contract('0x39C410eFE75DDfdBe4Be5455A7b368a533da15E1', [
      'function mintViaDedicatedAddress(address to, uint256 amount)',
    ]);

    // Convert BigNumber to string
    const amountString = amount.toString();

    const mintCalldata = targetContract.interface.encodeFunctionData('mintViaDedicatedAddress', [
      from,
      amountString,
    ]);

    console.log('Mint Calldata:', mintCalldata);
    console.log('Target Chain ID:', targetChainId);
    
    try {
      const relayResponse = await relay.sponsoredCall(
        {
          chainId: BigInt(targetChainId),
          target: '0x39C410eFE75DDfdBe4Be5455A7b368a533da15E1',
          data: mintCalldata,
        },
        gelatoApiKey,
      );
      console.log('Relay is responding:', relayResponse);
    } catch (error) {
      console.error('Error in relay call:', error);
      return { canExec: false, message: `Error in relay call: ${error.message}` };
    }

    return { canExec: false, message: 'Processed events and relayed transactions' };
  } catch (error) {
    console.error('Unexpected error in Web3 Function:', error);
    return { canExec: false, message: `Unexpected error: ${error.message}` };
  }
});

// Pass the onRun function to the Web3Function.onRun method
// Web3Function.onRun(onRun);
