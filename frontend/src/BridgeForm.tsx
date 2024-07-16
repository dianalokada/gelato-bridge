import React, { useState } from 'react';
import { ethers } from 'ethers';

interface BridgeFormProps {
  onSubmit: (amount: string, targetChain: string) => void;
}

const BridgeForm: React.FC<BridgeFormProps> = ({ onSubmit }) => {
  const [amount, setAmount] = useState('');
  const [targetChain, setTargetChain] = useState('optimism');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !ethers.isAddress(targetChain)) {
      alert('Please enter a valid amount and target chain');
      return;
    }
    onSubmit(amount, targetChain);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="amount">Amount to Bridge:</label>
        <input
          type="text"
          id="amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Enter amount"
        />
      </div>
      <div>
        <label htmlFor="targetChain">Target Chain:</label>
        <select
          id="targetChain"
          value={targetChain}
          onChange={(e) => setTargetChain(e.target.value)}
        >
          <option value="optimism">Optimism</option>
          <option value="arbitrum">Arbitrum</option>
        </select>
      </div>
      <button type="submit">Bridge Tokens</button>
    </form>
  );
};

export default BridgeForm;