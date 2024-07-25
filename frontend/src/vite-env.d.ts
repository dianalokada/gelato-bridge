/// <reference types="vite/client" />
// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_CONTRACT_ADDRESS_ARBITRUM_SEPOLIA: string;
    readonly VITE_CONTRACT_ADDRESS_OPTIMISM_SEPOLIA: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}