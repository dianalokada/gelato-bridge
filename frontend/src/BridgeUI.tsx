import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import './BridgeUI.css';
import logo from './assets/gelato2.png';

interface BridgeUIProps {
  signer: ethers.Signer;
  arbitrumContractAddress: string;
  optimismContractAddress: string;
}

const isNetworkError = (error: unknown): error is { code: string } => {
  return typeof error === 'object' && error !== null && 'code' in error;
};

const BridgeUI: React.FC<BridgeUIProps> = ({
  signer,
  arbitrumContractAddress,
  optimismContractAddress,
}) => {
  const [amount, setAmount] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentChainId, setCurrentChainId] = useState<string>('');
  const [sourceChainId, setSourceChainId] = useState<string>('421614');
  const [destChainId, setDestChainId] = useState<string>('11155420');

  const ABI = [
    'event TokensMinted(address indexed to, uint256 amount)',
    'event TokensBurned(address indexed from, uint256 amount)',
    'function mintViaDedicatedAddress(address to, uint256 amount)',
    'function burn(uint256 amount)',
    'function mintToAdmin(uint256 amount)',
    'function setDedicatedAddress(address _dedicatedAddress)',
  ];

  useEffect(() => {
    const updateNetworkInfo = async () => {
      if (signer.provider) {
        const network = await signer.provider.getNetwork();
        const chainId = network.chainId.toString();
        setCurrentChainId(chainId);
        console.log("Connected to network:", network.name, "Chain ID:", chainId);
      }
    };

    updateNetworkInfo();

    const provider = signer.provider as ethers.BrowserProvider;
    if (provider) {
      provider.on('network', (newNetwork) => {
        console.log("Network changed to:", newNetwork.chainId);
        setCurrentChainId(newNetwork.chainId.toString());
      });
    }

    return () => {
      if (provider) {
        provider.removeAllListeners('network');
      }
    };
  }, [signer]);

  useEffect(() => {
    if (currentChainId === '421614' || currentChainId === '11155420') {
      setSourceChainId(currentChainId);
      setDestChainId(currentChainId === '421614' ? '11155420' : '421614');
    }
  }, [currentChainId]);

  const handleBridge = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
        throw new Error('Please enter a valid amount.');
      }

      if (!signer.provider) {
        throw new Error('No provider available');
      }

      if (currentChainId !== sourceChainId) {
        throw new Error(`Please switch to the ${sourceChainId === '421614' ? 'Arbitrum Sepolia' : 'Optimism Sepolia'} network to proceed.`);
      }

      const contractAddress = currentChainId === '421614' ? arbitrumContractAddress : optimismContractAddress;
      const contract = new ethers.Contract(contractAddress, ABI, signer);

      console.log(`Initiating burn on chain ${currentChainId} for amount ${amount}`);
      const tx = await contract.burn(ethers.parseUnits(amount, 18));
      console.log("Transaction sent:", tx.hash);
      await tx.wait();
      console.log("Transaction mined");

      alert(`Bridge transaction (burn) submitted successfully on ${currentChainId === '421614' ? 'Arbitrum Sepolia' : 'Optimism Sepolia'}! The Web3Function will handle minting on the destination chain.`);
    } catch (error) {
      console.error('Error in handleBridge:', error);
      if (isNetworkError(error) && error.code === 'NETWORK_ERROR') {
        alert('Network changed during the transaction. Please ensure you are on the correct network and try again.');
      } else {
        alert('An error occurred while bridging: ' + (error as Error).message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSourceChainChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSourceChainId = e.target.value;
    setSourceChainId(newSourceChainId);
    setDestChainId(newSourceChainId === '421614' ? '11155420' : '421614');
  };

  const mintTokens = async () => {
    if (!signer || !signer.provider) return;
    setIsLoading(true);

    try {
      const contractAddress = currentChainId === '421614' ? arbitrumContractAddress : optimismContractAddress;
      const contract = new ethers.Contract(contractAddress, ABI, signer);
      
      console.log(`Minting tokens on chain ${currentChainId}`);
      const tx = await contract.mintToAdmin(ethers.parseUnits('100', 18));
      console.log("Mint transaction sent:", tx.hash);
      await tx.wait();
      console.log("Mint transaction mined");
      
      alert('Tokens minted successfully!');
    } catch (error) {
      console.error('Error minting tokens:', error);
      alert('Failed to mint tokens: ' + (error as Error).message);
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
          <select value={destChainId} disabled>
            <option value="421614">Arbitrum Sepolia</option>
            <option value="11155420">Optimism Sepolia</option>
          </select>
        </div>
        <button type="submit" disabled={isLoading || currentChainId !== sourceChainId}>
          {isLoading ? 'Bridging...' : 'Bridge Tokens'}
        </button>
        <button type="button" onClick={mintTokens} disabled={isLoading}>
          Mint Test Tokens
        </button>
      </form>
      {currentChainId !== sourceChainId && (
        <p className="warning">Please switch to the {sourceChainId === '421614' ? 'Arbitrum Sepolia' : 'Optimism Sepolia'} network to proceed.</p>
      )}
    </div>
  );
};

export default BridgeUI;