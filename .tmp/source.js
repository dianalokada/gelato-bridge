// web3Function/bridge/index.ts
import {
  Web3Function
} from "@gelatonetwork/web3-functions-sdk";
import { Contract, ethers, EventLog } from "ethers";
import { GelatoRelay } from "@gelatonetwork/relay-sdk";
var ABI = [
  "event TokensMinted(address indexed to, uint256 amount)",
  "event TokensBurned(address indexed from, uint256 amount)",
  "function mint(address to, uint256 amount)"
];
var relay = new GelatoRelay();
var onRun = async (context) => {
  const { userArgs, secrets } = context;
  const arbitrumSepoliaRPC = userArgs.arbitrumSepoliaRPC;
  const optimismSepoliaRPC = userArgs.optimismSepoliaRPC;
  const contractAddressArbitrumSepolia = userArgs.contractAddressArbitrumSepolia;
  const contractAddressOptimismSepolia = userArgs.contractAddressOptimismSepolia;
  const gelatoApiKey = await secrets.get("GELATO_API_KEY");
  if (!gelatoApiKey) {
    return { canExec: false, message: `GELATO_API_KEY not set in secrets` };
  }
  if (!contractAddressArbitrumSepolia) {
    throw new Error("Arbitrum Sepolia contract address is not defined in userArgs");
  }
  if (!contractAddressOptimismSepolia) {
    throw new Error("Optimism Sepolia contract address is not defined in userArgs");
  }
  try {
    const arbitrumProvider = new ethers.JsonRpcProvider(arbitrumSepoliaRPC);
    const optimismProvider = new ethers.JsonRpcProvider(optimismSepoliaRPC);
    const arbitrumContract = new Contract(
      contractAddressArbitrumSepolia,
      ABI,
      arbitrumProvider
    );
    const optimismContract = new Contract(
      contractAddressOptimismSepolia,
      ABI,
      optimismProvider
    );
    const processEvents = async (sourceContract, targetContract, targetChainId, targetAddress) => {
      const filter = sourceContract.filters.TokensBurned();
      const events = await sourceContract.queryFilter(filter, -1e3, "latest");
      for (const event of events) {
        console.log("EVENT", event);
        if (event instanceof EventLog && event.args) {
          const [from, amount] = event.args;
          const mintCalldata = targetContract.interface.encodeFunctionData("mintViaDedicatedAddress", [from, amount]);
          try {
            const relayResponse = await relay.sponsoredCall(
              {
                chainId: targetChainId,
                target: targetAddress,
                data: mintCalldata
              },
              gelatoApiKey
            );
            console.log(`Relay response: ${relayResponse.taskId}`);
          } catch (error) {
            console.error("Error relaying transaction:", error);
          }
        }
      }
    };
    await processEvents(
      arbitrumContract,
      optimismContract,
      BigInt(11155420),
      contractAddressOptimismSepolia
    );
    await processEvents(
      optimismContract,
      arbitrumContract,
      BigInt(421614),
      contractAddressArbitrumSepolia
    );
    return { canExec: false, message: "Processed events and relayed transactions" };
  } catch (error) {
    console.error("Error in Web3 Function:", error);
    return { canExec: false, message: `Error occurred: ${error.message}` };
  }
};
Web3Function.onRun(onRun);
export {
  onRun
};
