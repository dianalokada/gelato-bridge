import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import BridgeUI from './BridgeUI';

declare global {
  interface Window {
    ethereum?: ethers.Eip1193Provider;
  }
}

const App: React.FC = () => {
  const [signer, setSigner] = useState<ethers.Signer | null>(null);

  useEffect(() => {
    const setupSigner = async () => {
      if (typeof window.ethereum !== 'undefined') {
        try {
          await window.ethereum.request({ method: 'eth_requestAccounts' });
          const provider = new ethers.BrowserProvider(window.ethereum);
          const newSigner = await provider.getSigner();
          setSigner(newSigner);
        } catch (error) {
          console.error('Failed to connect to Ethereum:', error);
        }
      } else {
        console.log('Please install MetaMask!');
      }
    };
    setupSigner();
  }, []);

  const arbitrumContractAddress = import.meta.env.VITE_CONTRACT_ADDRESS_ARBITRUM_SEPOLIA;
  const optimismContractAddress = import.meta.env.VITE_CONTRACT_ADDRESS_OPTIMISM_SEPOLIA;

  if (!arbitrumContractAddress || !optimismContractAddress) {
    console.error('Contract addresses are not properly set in environment variables');
    return <div>Error: Contract addresses are not properly configured.</div>;
  }
  
  return (
    <div>
      {signer ? (
        <BridgeUI
          signer={signer}
          arbitrumContractAddress={arbitrumContractAddress}
          optimismContractAddress={optimismContractAddress}
        />
      ) : (
        <p>Connecting to Ethereum...</p>
      )}
    </div>
  );
};

export default App;