# Cross-Chain Token Bridge

This project implements a cross-chain token bridge between Arbitrum Sepolia and Optimism Sepolia testnets using Gelato's Web3 Functions, Relay service and 1balance.

## Overview

This bridge allows users to transfer tokens between Arbitrum Sepolia and Optimism Sepolia testnets. It consists of:

1. Smart Contracts: MockERC20 tokens deployed on both networks.
2. Web3 Function: A Gelato Web3 Function that listens for burn events and mints tokens on the destination chain.
3. Frontend: A React application that provides a user interface for the bridge.

## Features

- Burn tokens on the source chain
- Automatically mint tokens on the destination chain
- Support for bridging between Arbitrum Sepolia and Optimism Sepolia
- User-friendly interface for initiating bridge transactions

## Prerequisites

- Node.js and npm
- MetaMask or another Web3 wallet
- Test ETH on Arbitrum Sepolia and Optimism Sepolia

## Installation

Clone the repository:

```bash
git clone https://github.com/dianalokada/gelato-bridge
```

Install dependencies:

```bash
npm install
```

# Contracts Quick Start

Compile the contrac

```bash
npx hardhat compile
```

## Deploy the contracts on arbitrumSepolia and optimismSepolia

```bash
npx hardhat run scripts/deploy.ts --network arbitrumSepolia
npx hardhat run scripts/deploy.ts --network optimismSepolia
```

## Create a `.env` file in the root directory and add your contract addresses and privite key

```bash
CONTRACT_ADDRESS_ARBITRUM_SEPOLIA=0x...
CONTRACT_ADDRESS_OPTIMISM_SEPOLIA=0x....
PRIVATE_KEY=...
```

## Smart Contracts block explorers

- Arbitrum Sepolia: https://sepolia.arbiscan.io/
- Optimism Sepolia: https://sepolia-optimism.etherscan.io/

# Frontend Quick Start

From the project root, navigate to the frontend folder:

```bash
cd frontend
```

Install project dependencies

```bash
npm install
```

Run the frontend

```bash
npm run dev
```

## Update contract addresses in the App.tsx

Replace `MY_ARBITRUM_CONTRACT_ADDRESS` and `MY_OPTIMISM_CONTRACT_ADDRESS` with the actual deployed contract addresses.

## Configure MetaMask

- Add Arbitrum Sepolia and Optimism Sepolia networks to MetaMask.
- Fund your MetaMask account with testnet tokens for both networks.

## Open your browser and navigate to http://localhost:5173

Connect your Web3 wallet (ensure you're on either Arbitrum Sepolia or Optimism Sepolia network)

- First, use the "Mint Test Tokens" button to mint ERC20 tokens for testing
- After, enter the amount you want to bridge and click "Bridge Tokens"

## Web3 Function

The Web3 Function code is located in `web3Function/bridge/index.ts`. It listens for `TokensBurned` events on both networks and mints corresponding tokens on the destination chain.

## Interact with the UI

- Connect MetaMask to your app.
- Switch between Arbitrum Sepolia and Optimism Sepolia in MetaMask to test bridging from both directions.

## Test the bridge

- Mint tokens before bridging
- Input an amount to bridge
- Select the source chain
- Click "Bridge Tokens"
- Approve the transaction in MetaMask

https://github.com/user-attachments/assets/8ae1a04c-dc46-47ae-9634-8b36ff18572a

## Verify the result

- Check that tokens were burned on the source chain
- Switch to the destination chain in MetaMask
- Verify that tokens were minted on the destination chain
