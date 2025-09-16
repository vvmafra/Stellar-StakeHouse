import { Networks } from '@stellar/stellar-sdk';

// Stellar network configuration
export const STELLAR_CONFIG = {
  // Use testnet for development, mainnet for production
  network: process.env.NODE_ENV === 'production' ? Networks.PUBLIC : Networks.TESTNET,
  
  // Network passphrase for the selected network
  networkPassphrase: process.env.NODE_ENV === 'production' 
    ? 'Public Global Stellar Network ; September 2015'
    : 'Test SDF Network ; September 2015',
    
  // Horizon server URL
  horizonUrl: process.env.NODE_ENV === 'production'
    ? 'https://horizon.stellar.org'
    : 'https://horizon-testnet.stellar.org',
    
  // Freighter configuration
  freighter: {
    // Timeout for wallet operations (in milliseconds)
    timeout: 30000,
    
    // Whether to allow custom networks
    allowCustomNetwork: false,
  },

  // RPC URL
  rpcUrl: 'https://soroban-testnet.stellar.org',

  // CONTRACT_ID: "CCUF3VIEKSYCBX5GIZEJ7YJ2GXZSD75TL34OC2K427XMZXXUCBI2WJH5",
  // CONTRACT_ID: "CBU4MSLD55YZP3WPBWBMG4KOPS4GE322IXN3YEXU7NCRRWPXTSG67ZUB",
  // CONTRACT_ID: "CCVJ7LOHLGW2UFEOKCAWTN5F2G65SLS34CEVKJA6RVPKENI2QGB4F7LG",
  // CONTRACT_ID: "CBD5ULFMRKD4J73F5NJIJYM66BAFHGXQMNDLDFXQAMPJMDLBF24M6YX7",
  CONTRACT_ID: "CA5GUTKHLTCE5BXH2BW2DEPZU2AABM3O4BDTUNHFJJSLWM5PJG3LVRZA",

} as const;

// Helper function to get current network info
export const getCurrentNetwork = () => {
  return {
    network: STELLAR_CONFIG.network,
    passphrase: STELLAR_CONFIG.networkPassphrase,
    horizonUrl: STELLAR_CONFIG.horizonUrl,
    isTestnet: STELLAR_CONFIG.network === Networks.TESTNET,
    isMainnet: STELLAR_CONFIG.network === Networks.PUBLIC,
  };
};

// Network display names
export const NETWORK_NAMES = {
  [Networks.TESTNET]: 'Testnet',
  [Networks.PUBLIC]: 'Mainnet',
} as const;

