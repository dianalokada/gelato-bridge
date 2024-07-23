import { Web3Function, Web3FunctionEventContext } from '@gelatonetwork/web3-functions-sdk';
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

    // Ensure amount is a BigInt
    const amountBigInt = BigInt(amount);

    console.log(
      `MockERC20.Burn event detected on ChainA. From: ${from} Amount: ${amountBigInt.toString()}`,
    );

    // Get api from secrets
    const gelatoApiKey = await secrets.get('GELATO_API_KEY');
    if (!gelatoApiKey) {
      return { canExec: false, message: `GELATO_API_KEY not set in secrets` };
    }

    const contractAddressArbitrumSepolia = userArgs.contractAddressArbitrumSepolia as string;
    const contractAddressOptimismSepolia = userArgs.contractAddressOptimismSepolia as string;
    const arbitrumChainID = Number(userArgs.arbitrumChainID);
    const optimismChainID = Number(userArgs.optimismChainID);
    let sourceChainId = Number(gelatoArgs.chainId);
    console.log('Source Chain ID from gelatoArgs:', sourceChainId);

    // Check if the sourceChainId is one of the expected chain IDs
    // if (sourceChainId !== arbitrumChainID && sourceChainId !== optimismChainID) {
    //   console.log('Unexpected source chain ID. Defaulting to Arbitrum Sepolia.');
    //   sourceChainId = arbitrumChainID;
    // }

    function getTargetChainIdAndContract(sourceChainId: number): {
      chainId: number;
      contractAddress: string;
    } {
      if (sourceChainId === arbitrumChainID) {
        return { chainId: optimismChainID, contractAddress: contractAddressOptimismSepolia };
      } else if (sourceChainId === optimismChainID) {
        return { chainId: arbitrumChainID, contractAddress: contractAddressArbitrumSepolia };
      } else {
        console.log('Unexpected sourceChainId. Defaulting to Arbitrum Sepolia.');
        return { chainId: arbitrumChainID, contractAddress: contractAddressOptimismSepolia };
      }
    }

    const { chainId: targetChainId, contractAddress: targetContractAddress } =
      getTargetChainIdAndContract(sourceChainId);
    console.log(`Target Chain ID: ${targetChainId}`);
    console.log(`Target Contract Address: ${targetContractAddress}`);

    const targetContract = new Contract(targetContractAddress, [
      'function mintViaDedicatedAddress(address to, uint256 amount)',
    ]);

    // Convert BigNumber to string
    const amountString = amount.toString();

    const mintCalldata = targetContract.interface.encodeFunctionData('mintViaDedicatedAddress', [
      from,
      amountString,
    ]);

    console.log('Prepered Mint Calldata for Chain B:', mintCalldata);
    console.log('Target Chain ID:', targetChainId);

    try {
      console.log('Initiating relay call to mint tokens on ChainB');
      const relayResponse = await relay.sponsoredCall(
        {
          chainId: BigInt(targetChainId),
          target: targetContractAddress,
          data: mintCalldata,
        },
        gelatoApiKey,
      );
      console.log(`Relay call successful, Task ID: ${relayResponse.taskId}`);
      // the actual minting is async, so we can't confirm it here
      console.log('MockERC20.Mint transaction submitted to ChainB, check ChainB explorer');
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
