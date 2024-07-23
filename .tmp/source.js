// web3Function/bridge/index.ts
import { Web3Function } from "@gelatonetwork/web3-functions-sdk";
import { Contract } from "ethers";
import { GelatoRelay } from "@gelatonetwork/relay-sdk";
import { Interface } from "@ethersproject/abi";
var ABI = ["event TokensBurned(address indexed from, uint256 amount)"];
var relay = new GelatoRelay();
Web3Function.onRun(async (context) => {
  console.log("Starting onRun function");
  const { userArgs, secrets, log, gelatoArgs } = context;
  if (!log) {
    console.log("No log data available");
    return { canExec: false, message: "No log data available" };
  }
  try {
    let getTargetChainIdAndContract2 = function(sourceChainId2) {
      if (sourceChainId2 === arbitrumChainID) {
        return { chainId: optimismChainID, contractAddress: contractAddressOptimismSepolia };
      } else if (sourceChainId2 === optimismChainID) {
        return { chainId: arbitrumChainID, contractAddress: contractAddressArbitrumSepolia };
      } else {
        console.log("Unexpected sourceChainId. Defaulting to Arbitrum Sepolia.");
        return { chainId: arbitrumChainID, contractAddress: contractAddressOptimismSepolia };
      }
    };
    var getTargetChainIdAndContract = getTargetChainIdAndContract2;
    const token = new Interface(ABI);
    const event = token.parseLog(log);
    const { from, amount } = event.args;
    const amountBigInt = BigInt(amount);
    console.log(
      `MockERC20.Burn event detected on ChainA. From: ${from} Amount: ${amountBigInt.toString()}`
    );
    const gelatoApiKey = await secrets.get("GELATO_API_KEY");
    if (!gelatoApiKey) {
      return { canExec: false, message: `GELATO_API_KEY not set in secrets` };
    }
    const contractAddressArbitrumSepolia = userArgs.contractAddressArbitrumSepolia;
    const contractAddressOptimismSepolia = userArgs.contractAddressOptimismSepolia;
    const arbitrumChainID = Number(userArgs.arbitrumChainID);
    const optimismChainID = Number(userArgs.optimismChainID);
    let sourceChainId = Number(gelatoArgs.chainId);
    console.log("Source Chain ID from gelatoArgs:", sourceChainId);
    const { chainId: targetChainId, contractAddress: targetContractAddress } = getTargetChainIdAndContract2(sourceChainId);
    console.log(`Target Chain ID: ${targetChainId}`);
    console.log(`Target Contract Address: ${targetContractAddress}`);
    const targetContract = new Contract(targetContractAddress, [
      "function mintViaDedicatedAddress(address to, uint256 amount)"
    ]);
    const amountString = amount.toString();
    const mintCalldata = targetContract.interface.encodeFunctionData("mintViaDedicatedAddress", [
      from,
      amountString
    ]);
    console.log("Prepered Mint Calldata for Chain B:", mintCalldata);
    console.log("Target Chain ID:", targetChainId);
    try {
      console.log("Initiating relay call to mint tokens on ChainB");
      const relayResponse = await relay.sponsoredCall(
        {
          chainId: BigInt(targetChainId),
          target: targetContractAddress,
          data: mintCalldata
        },
        gelatoApiKey
      );
      console.log(`Relay call successful, Task ID: ${relayResponse.taskId}`);
      console.log("MockERC20.Mint transaction submitted to ChainB, check ChainB explorer");
    } catch (error) {
      console.error("Error in relay call:", error);
      return { canExec: false, message: `Error in relay call: ${error.message}` };
    }
    return { canExec: false, message: "Processed events and relayed transactions" };
  } catch (error) {
    console.error("Unexpected error in Web3 Function:", error);
    return { canExec: false, message: `Unexpected error: ${error.message}` };
  }
});
