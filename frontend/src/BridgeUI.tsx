import React, { useState } from 'react';
import { ethers } from 'ethers';

// Define the props interface for the BridgeUI component
interface BridgeUIProps {
  signer: ethers.Signer; // Ethereum signer for transactions
  arbitrumContractAddress: string; // Contract address on Arbitrum
  optimismContractAddress: string; // Contract address on Optimism
}

// Define the BridgeUI component
const BridgeUI: React.FC<BridgeUIProps> = ({
  signer,
  arbitrumContractAddress,
  optimismContractAddress,
}) => {
  // State hooks for managing component state
  const [amount, setAmount] = useState<string>(''); // Amount to bridge
  const [isLoading, setIsLoading] = useState<boolean>(false); // Loading state
  const [sourceChainId, setSourceChainId] = useState<string>('421614'); // Source chain ID (default: Arbitrum Sepolia)
  const [destChainId, setDestChainId] = useState<string>('11155420'); // Source chain ID (default: Optimism Sepolia)

  // ABI for the smart contract
  const ABI = [
    'function burn(uint256 amount)',
    'function mint(address to, uint256 amount)',
    'function mintToAdmin(uint256 amount)',
    'event TokensBurned(address indexed from, uint256 amount)',
    'event TokensMinted(address indexed to, uint256 amount)',
  ];

  // Determine the source contract address based on the selected chain
  const sourceContractAddress =
    sourceChainId === '421614'
      ? arbitrumContractAddress
      : optimismContractAddress;

  // Handle the bridge transaction
  const handleBridge = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevent form submission
    setIsLoading(true); // Set loading state to true

    try {
      // Create a new contract instance
      const contract = new ethers.Contract(sourceContractAddress, ABI, signer);

      // Call the burn function to initiate the bridge
      const tx = await contract.burn(ethers.parseUnits(amount, 18));
      await tx.wait(); // Wait for the transaction to be mined

      // Alert user of successful transaction
      alert(
        'Bridge transaction (burn) submitted successfully! The Web3Function will handle minting on the destination chain.'
      );
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred while bridging.');
    } finally {
      setIsLoading(false); // Set loading state to false regardless of outcome
    }
  };

  // Handle source chain selection change
  const handleSourceChainChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    // Update source chain ID
    setSourceChainId(e.target.value);
    // Update destination chain ID to the other option
    setDestChainId(e.target.value === '421614' ? '11155420' : '421614');
  };

  const mintTokens = async () => {
    if (!signer) return;
    setIsLoading(true);
    try {
      // Get the provider from the signer
      const provider = signer.provider;
      if (!provider) {
        throw new Error('No provider available');
      }

      // Get the network from the provider, which includes the chainId
      const network = await provider.getNetwork();
      const chainId = network.chainId;

      const contractAddress =
        chainId === 421614n ? arbitrumContractAddress : optimismContractAddress;
      const contract = new ethers.Contract(contractAddress, ABI, signer);
      const tx = await contract.mintToAdmin(ethers.parseUnits('100', 18)); // Mint 100 tokens
      await tx.wait();
      alert('Tokens minted successfully!');
    } catch (error) {
      console.error('Error minting tokens:', error);
      alert('Failed to mint tokens.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bridge-ui">
      <form onSubmit={handleBridge}>
        <div>
          <label>Amount to Bridge:</label>
          <input
            type="text"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.0"
          />
        </div>
        <div>
          <label>From Chain:</label>
          <select value={sourceChainId} onChange={handleSourceChainChange}>
            <option value="421614">Arbitrum Sepolia</option>
            <option value="11155420">Optimism Sepolia</option>
          </select>
        </div>
        <div>
          <label>To Chain:</label>
          <select value={destChainId} disabled>
            <option value="421614">Arbitrum Sepolia</option>
            <option value="11155420">Optimism Sepolia</option>
          </select>
        </div>
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Bridging...' : 'Bridge Tokens'}
        </button>
        <button onClick={mintTokens} disabled={isLoading}>
          Mint Test Tokens
        </button>
      </form>
    </div>
  );
};

export default BridgeUI;
