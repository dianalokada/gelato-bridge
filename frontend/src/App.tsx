import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import BridgeUI from './BridgeUI';
import { ExternalProvider } from '@ethersproject/providers';
import { Eip1193Provider } from 'ethers';

// Define a custom type that combines ExternalProvider and Eip1193Provider
type EthereumProvider = ExternalProvider & Eip1193Provider;

// Extend the global Window interface to include the ethereum property
declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

// Define the main App component
const App: React.FC = () => {
  // State to hold the ethers Signer object
  const [signer, setSigner] = useState<ethers.Signer | null>(null);

  // useEffect hook to set up the signer when the component mounts
  useEffect(() => {
    // Check if ethereum object is available in the window (i.e., MetaMask is installed)
    const setupSigner = async () => {
      if (typeof window.ethereum !== 'undefined') {
        try {
          // Request user accounts access
          await window.ethereum.request({ method: 'eth_requestAccounts' });
          // Create a new ethers provider using the ethereum object
          const provider = new ethers.BrowserProvider(window.ethereum);
          // Get the signer from the provider
          const newSigner = await provider.getSigner();
          // Set the signer in the component's state
          setSigner(newSigner);
        } catch (error) {
          console.error('Failed to connect to Ethereum:', error);
        }
      } else {
        // An errors if MetaMask is not installed
        console.log('Please install MetaMask!');
      }
    };
    // Call the setupSigner function
    setupSigner();
  }, []); // Empty dependency array means this effect runs once on mount

  // Define contract addresses for Arbitrum and Optimism
  const arbitrumContractAddress = '0x88D8934d048A2D24ab124E9Fa1A86Fb49ac8e81c';
  const optimismContractAddress = '0x88D8934d048A2D24ab124E9Fa1A86Fb49ac8e81c';

  return (
    <div>
      <h1>Token Bridge</h1>
      {signer ? (
        // If signer is available, render the BridgeUI component
        <BridgeUI
          signer={signer}
          arbitrumContractAddress={arbitrumContractAddress}
          optimismContractAddress={optimismContractAddress}
        />
      ) : (
        // If signer is not yet available, show a loading message
        <p>Connecting to Ethereum...</p>
      )}
    </div>
  );
};

export default App;
