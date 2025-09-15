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
  }
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