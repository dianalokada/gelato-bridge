// web3Function/bridge/index.ts
import {
  Web3Function
} from "@gelatonetwork/web3-functions-sdk";
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
    let getTargetChainId2 = function(sourceChainId2) {
      console.log("getTargetChainId input:", sourceChainId2);
      if (sourceChainId2 === arbitrumChainID) {
        return optimismChainID;
      } else if (sourceChainId2 === optimismChainID) {
        return arbitrumChainID;
      } else {
        console.log("Unexpected sourceChainId. Defaulting to Optimism Sepolia.");
        return optimismChainID;
      }
    };
    var getTargetChainId = getTargetChainId2;
    const token = new Interface(ABI);
    const event = token.parseLog(log);
    const { from, amount } = event.args;
    console.log(`Burning event detected from ${from}`);
    const gelatoApiKey = await secrets.get("GELATO_API_KEY");
    if (!gelatoApiKey) {
      return { canExec: false, message: `GELATO_API_KEY not set in secrets` };
    }
    const arbitrumChainID = Number(userArgs.arbitrumChainID);
    const optimismChainID = Number(userArgs.optimismChainID);
    let sourceChainId = Number(gelatoArgs.chainId);
    console.log("Source Chain ID from gelatoArgs:", sourceChainId);
    if (sourceChainId !== arbitrumChainID && sourceChainId !== optimismChainID) {
      console.log("Unexpected source chain ID. Defaulting to Arbitrum Sepolia.");
      sourceChainId = arbitrumChainID;
    }
    const targetChainId = getTargetChainId2(sourceChainId);
    const targetContract = new Contract("0x39C410eFE75DDfdBe4Be5455A7b368a533da15E1", [
      "function mintViaDedicatedAddress(address to, uint256 amount)"
    ]);
    const amountString = amount.toString();
    const mintCalldata = targetContract.interface.encodeFunctionData("mintViaDedicatedAddress", [
      from,
      amountString
    ]);
    console.log("Mint Calldata:", mintCalldata);
    console.log("Target Chain ID:", targetChainId);
    try {
      const relayResponse = await relay.sponsoredCall(
        {
          chainId: BigInt(targetChainId),
          target: "0x39C410eFE75DDfdBe4Be5455A7b368a533da15E1",
          data: mintCalldata
        },
        gelatoApiKey
      );
      console.log("Relay is responding:", relayResponse);
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
