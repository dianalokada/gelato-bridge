// web3Function/bridge/index.ts
import {
  Web3Function
} from "@gelatonetwork/web3-functions-sdk";
import { Contract } from "ethers";
import { GelatoRelay } from "@gelatonetwork/relay-sdk";
import { Interface } from "@ethersproject/abi";
var ABI = [
  "event TokensBurned(address indexed from, uint256 amount)"
];
var relay = new GelatoRelay();
var onRun = async (context) => {
  console.log("Starting onRun function");
  const { userArgs, secrets, log, gelatoArgs } = context;
  const token = new Interface(ABI);
  const event = token.parseLog(log);
  const { from, amount } = event.args;
  console.log(`burning event detected from ${from} ${amount} `);
  const gelatoApiKey = await secrets.get("GELATO_API_KEY");
  if (!gelatoApiKey) {
    return { canExec: false, message: `GELATO_API_KEY not set in secrets` };
  }
  const chainId = gelatoArgs.chainId;
  const arbitrumSepoliaRPC = userArgs.arbitrumSepoliaRPC;
  const optimismSepoliaRPC = userArgs.optimismSepoliaRPC;
  const contractAddressArbitrumSepolia = userArgs.contractAddressArbitrumSepolia;
  const contractAddressOptimismSepolia = userArgs.contractAddressOptimismSepolia;
  const arbitrumChainID = userArgs.arbitrumChainID;
  const optimismChainID = userArgs.optimismChainID;
  function getTargetChainId(sourceChainId) {
    if (sourceChainId === arbitrumChainID) {
      return optimismChainID;
    } else {
      return arbitrumChainID;
    }
  }
  const targetContract = new Contract(
    "0x39C410eFE75DDfdBe4Be5455A7b368a533da15E1",
    [
      "function mintViaDedicatedAddress(address to, uint256 amount)"
    ]
  );
  const mintCalldata = targetContract.interface.encodeFunctionData(
    "mintViaDedicatedAddress",
    [from, amount]
  );
  relay.sponsoredCall(
    {
      chainId: BigInt(getTargetChainId(gelatoArgs.chainId)),
      target: "0x39C410eFE75DDfdBe4Be5455A7b368a533da15E1",
      data: mintCalldata
    },
    gelatoApiKey
  );
  return { canExec: false, message: "Processed events and relayed transactions" };
};
Web3Function.onRun(onRun);
export {
  onRun
};
