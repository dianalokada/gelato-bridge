import React from 'react';
import BridgeForm from './BridgeForm'

const App: React.FC = () => {
  const handleBridgeSubmit = (amount: string, targetChain: string) => {
    // implementation of the actual bridge transaction logic
    console.log(`Bridging ${amount} to ${targetChain}`);
    // Call the smart contract or API here
  };

  return (
    <div>
      <h1>Token Bridge</h1>
      <BridgeForm onSubmit={handleBridgeSubmit} />
    </div>
  );
};

export default App;