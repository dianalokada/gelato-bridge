import { expect } from 'chai';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { ethers } from 'ethers';
import 'hardhat/types/runtime';
import { Web3Function } from '@gelatonetwork/web3-functions-sdk';

declare module 'hardhat/types/runtime' {
  export interface HardhatRuntimeEnvironment {
    w3f: {
      get: (name: string) => Web3Function;
    };
  }
}

describe('Cross-Chain Token Bridge Web3 Function', function () {
  let owner: ethers.Signer;
  let user: ethers.Signer;
  let arbitrumContract: ethers.Contract;
  let optimismContract: ethers.Contract;
  let bridgeW3f: any;
  let hre: HardhatRuntimeEnvironment;

  const ABI = [
    'event TokensMinted(address indexed to, uint256 amount)',
    'event TokensBurned(address indexed from, uint256 amount)',
    'function mintViaDedicatedAddress(address to, uint256 amount)',
    'function burn(uint256 amount)',
    'function mintToAdmin(uint256 amount)',
    'function setDedicatedAddress(address _dedicatedAddress)',
  ];

  before(async function () {
    hre = require('hardhat');
    [owner, user] = await hre.ethers.getSigners();

    // Deploy mock contracts for Arbitrum and Optimism
    const MockToken = await hre.ethers.getContractFactory('MockToken');
    arbitrumContract = await MockToken.deploy();
    optimismContract = await MockToken.deploy();

    // Setup Web3 Function
    const { w3f } = hre;
    bridgeW3f = w3f.get('bridge');
  });

  it('should process TokensBurned events and relay mint transactions', async function () {
    // Simulate burning tokens on Arbitrum
    await arbitrumContract.burn(await user.getAddress(), hre.ethers.parseEther('100'));

    // Prepare user arguments
    const userArgs = {
      arbitrumSepoliaRPC: 'http://localhost:8545', // Use Hardhat's local network
      optimismSepoliaRPC: 'http://localhost:8545', // Use Hardhat's local network
      gelatoApiKey: 'mock-api-key',
      contractAddressArbitrumSepolia: await arbitrumContract.getAddress(),
      contractAddressOptimismSepolia: await optimismContract.getAddress(),
    };

    // Run the Web3 Function
    const { result } = await bridgeW3f.run({ userArgs });

    // Check the result
    expect(result.canExec).to.be.false;
    expect(result.message).to.equal('Processed events and relayed transactions');

    // Verify that tokens were minted on Optimism
    const mintedEvent = await optimismContract.queryFilter(optimismContract.filters.TokensMinted());
    expect(mintedEvent.length).to.equal(1);
    expect(mintedEvent[0].args?.to).to.equal(await user.getAddress());
    expect(mintedEvent[0].args?.amount).to.equal(hre.ethers.parseEther('100'));
  });

  // Add more tests as needed
});
