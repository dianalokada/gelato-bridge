import React, { useState } from 'react';
import { ethers } from 'ethers';
import ky from 'ky';
import './BridgeUI.css';
import logo from './assets/gelato2.png';

interface BridgeUIProps {
  signer: ethers.Signer;
  arbitrumContractAddress: string;
  optimismContractAddress: string;
}

const BridgeUI: React.FC<BridgeUIProps> = ({
  signer,
  arbitrumContractAddress,
  optimismContractAddress,
}) => {
  const [amount, setAmount] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [sourceChainId, setSourceChainId] = useState<string>('421614');
  const [targetChainId, setTargetChainId] = useState<string>('11155420');

  const ABI = [
    'event TokensBurned(address indexed from, uint256 amount)',
    'function burn(uint256 amount)',
    'function mintToAdmin(uint256 amount)',
  ];

  const sourceContractAddress =
    sourceChainId === '421614'
      ? arbitrumContractAddress
      : optimismContractAddress;

      //sendToServer function to send transaction details to the server
  const sendToServer = async (chainId: string, target: string, data: string) => {
    try {
      const response = await ky.post('http://localhost:3000/send-tokens', {
        json: {
          chainId,
          target,
          data,
        },
      }).json<{ taskId: string }>();

      console.log('Server response:', response);
      if (response.taskId) {
        alert(`Bridge transaction submitted successfully! Task ID: ${response.taskId}`);
      } else {
        alert('Failed to submit bridge transaction. Please check server logs.');
      }
    } catch (error) {
      console.error('Error sending to server:', error);
      alert('Failed to send transaction details to server.');
    }
  };

  const handleBridge = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Create a contract instance for the source chain, 
      //Call the burn function on the contract
      const contract = new ethers.Contract(sourceContractAddress, ABI, signer);
      const tx = await contract.burn(ethers.parseUnits(amount, 18));
      const receipt = await tx.wait();

      // Extract the TokensBurned event from the receipt
      const burnEvent = receipt?.logs.find(
        (log: ethers.Log) => log.topics[0] === ethers.id('TokensBurned(address,uint256)')
      );

      if (!burnEvent) {
        throw new Error('TokensBurned event not found in transaction receipt');
      }

      const fromAddress = await signer.getAddress();

      // Encode the function call data for the Web3 Function
      const encodedData = ethers.AbiCoder.defaultAbiCoder().encode(
        ['address', 'uint256'],
        [fromAddress, ethers.parseUnits(amount, 18)]
      );

      // Send the transaction details to the server
      await sendToServer(sourceChainId, sourceContractAddress, encodedData);

    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred while bridging.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSourceChainChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSourceChainId(e.target.value);
    setTargetChainId(e.target.value === '421614' ? '11155420' : '421614');
  };

  const mintTokens = async () => {
    if (!signer) return;
    setIsLoading(true);
    try {
      const provider = signer.provider;
      if (!provider) {
        throw new Error('No provider available');
      }

      const network = await provider.getNetwork();
      const chainId = network.chainId;

      const contractAddress =
        chainId === 421614n ? arbitrumContractAddress : optimismContractAddress;
      const contract = new ethers.Contract(contractAddress, ABI, signer);
      const tx = await contract.mintToAdmin(ethers.parseUnits('100', 18));
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
      <img src={logo} alt="Logo" className="bridge-logo" />
      <form onSubmit={handleBridge}>
        <div>
          <label>Amount to Send:</label>
          <input
            type="text"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.0 Tokens"
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
          <select value={targetChainId} disabled>
            <option value="421614">Arbitrum Sepolia</option>
            <option value="11155420">Optimism Sepolia</option>
          </select>
        </div>
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Bridging...' : 'Bridge Tokens'}
        </button>
        <button type="button" onClick={mintTokens} disabled={isLoading}>
          Mint Test Tokens
        </button>
      </form>
    </div>
  );
};

export default BridgeUI;
