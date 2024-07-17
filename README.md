## Deploy the contracts:

```bash
npx hardhat run scripts/deploy.ts --network arbitrumSepolia
npx hardhat run scripts/deploy.ts --network optimismSepolia
```
## Update contract addresses:
Replace 'MY_ARBITRUM_CONTRACT_ADDRESS' and 'MY_OPTIMISM_CONTRACT_ADDRESS' in the App.tsx with the actual deployed contract addresses.

## Install dependencies:
Make sure you have ethers installed: npm install ethers

## Configure MetaMask:
Add Arbitrum Sepolia and Optimism Sepolia networks to MetaMask.
Fund your MetaMask account with testnet tokens for both networks.

## Run the React app:
Use npm start or yarn start to run app locally.

## Interact with the UI:
Connect MetaMask to your app.
Switch between Arbitrum Sepolia and Optimism Sepolia in MetaMask to test bridging from both directions.

## Mint tokens for testing:
Before bridging, you need tokens to bridge. Add a function to mint tokens to your address for testing

## Monitor transactions:
Use the testnet block explorers to monitor the transactions:
Arbitrum Sepolia: https://sepolia.arbiscan.io/
Optimism Sepolia: https://sepolia-optimism.etherscan.io/

## Test the bridge:
Mint tokens
Input an amount to bridge
Select the source chain
Click "Bridge Tokens"
Approve the transaction in MetaMask

## Verify the result:
Check that tokens were burned on the source chain
Switch to the destination chain in MetaMask
Verify that tokens were minted on the destination chain