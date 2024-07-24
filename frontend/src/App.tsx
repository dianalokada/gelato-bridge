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

  const arbitrumContractAddress = '0xaEcA7e29566BbaF2dB1D3377DDE4c8AFf9356a67';
  const optimismContractAddress = '0x0c2AF99BA6A0fbd5FEc90564414BD97db6d95057';

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