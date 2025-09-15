import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { walletService, WalletInfo, WalletError } from '../services/walletService';

// Constants for localStorage keys
const WALLET_STORAGE_KEY = 'stellar_stake_house_wallet';

// Context types
interface WalletContextType {
  // State
  wallet: WalletInfo | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: WalletError | null;
  
  // Actions
  connectWallet: () => Promise<void>;
  disconnectWallet: () => Promise<void>;
  refreshWallet: () => Promise<void>;
  clearError: () => void;
}

// Create context
const WalletContext = createContext<WalletContextType | undefined>(undefined);

// Provider component
interface WalletProviderProps {
  children: ReactNode;
}

export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<WalletError | null>(null);

  // Check wallet connection on mount
  useEffect(() => {
    checkInitialConnection();
  }, []);

  const checkInitialConnection = async () => {
    try {
      // First check localStorage for persisted wallet
      const persistedWallet = getPersistedWallet();
      if (persistedWallet) {
        // Verify if wallet is still connected and has proper permissions
        const isWalletConnected = await walletService.isWalletConnected();
        if (isWalletConnected) {
          // Double-check by trying to get address to ensure full access
          try {
            const addressResult = await walletService.getAddress();
            if (addressResult && addressResult.address === persistedWallet.publicKey) {
              setWallet(persistedWallet);
              setIsConnected(true);
              // Update the service with the persisted wallet
              walletService.setCurrentWallet(persistedWallet);
              return;
            }
          } catch (accessError) {
            console.warn('Wallet access revoked, clearing persistence:', accessError);
            clearPersistedWallet();
          }
        } else {
          // Wallet was disconnected externally, clear persistence
          clearPersistedWallet();
        }
      }

      // Fallback to checking service directly
      const isWalletConnected = await walletService.isWalletConnected();
      if (isWalletConnected) {
        const currentWallet = walletService.getCurrentWallet();
        if (currentWallet) {
          setWallet(currentWallet);
          setIsConnected(true);
          persistWallet(currentWallet);
        }
      }
    } catch (error) {
      console.warn('Error checking initial wallet connection:', error);
      // Clear any corrupted persistence data
      clearPersistedWallet();
    }
  };

  // Helper functions for localStorage persistence
  const persistWallet = (walletInfo: WalletInfo) => {
    try {
      localStorage.setItem(WALLET_STORAGE_KEY, JSON.stringify(walletInfo));
    } catch (error) {
      console.warn('Failed to persist wallet to localStorage:', error);
    }
  };

  const getPersistedWallet = (): WalletInfo | null => {
    try {
      const persisted = localStorage.getItem(WALLET_STORAGE_KEY);
      return persisted ? JSON.parse(persisted) : null;
    } catch (error) {
      console.warn('Failed to get persisted wallet from localStorage:', error);
      return null;
    }
  };

  const clearPersistedWallet = () => {
    try {
      localStorage.removeItem(WALLET_STORAGE_KEY);
    } catch (error) {
      console.warn('Failed to clear persisted wallet from localStorage:', error);
    }
  };

  const connectWallet = async () => {
    try {
      setIsConnecting(true);
      setError(null);

      const walletInfo = await walletService.connectWallet();
      
      setWallet(walletInfo);
      setIsConnected(true);
      persistWallet(walletInfo);
      
      console.log('Wallet connected successfully:', walletInfo);
    } catch (error: any) {
      console.error('Error connecting wallet:', error);
      
      const walletError: WalletError = {
        code: 'CONNECTION_ERROR',
        message: error.message || 'Failed to connect to wallet',
        details: error,
      };
      
      setError(walletError);
      setIsConnected(false);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = async () => {
    try {
      setIsConnecting(true);
      setError(null);

      // Clear local state first
      setWallet(null);
      setIsConnected(false);
      clearPersistedWallet();

      // Then disconnect from wallet service
      await walletService.disconnectWallet();
      
      console.log('Wallet disconnected successfully');
    } catch (error: any) {
      console.error('Error disconnecting wallet:', error);
      
      // Even if there's an error, ensure local state is cleared
      setWallet(null);
      setIsConnected(false);
      clearPersistedWallet();
      
      const walletError: WalletError = {
        code: 'DISCONNECTION_ERROR',
        message: error.message || 'Failed to disconnect wallet',
        details: error,
      };
      
      setError(walletError);
    } finally {
      setIsConnecting(false);
    }
  };

  const refreshWallet = async () => {
    try {
      setError(null);
      
      const isWalletConnected = await walletService.isWalletConnected();
      if (isWalletConnected) {
        const currentWallet = walletService.getCurrentWallet();
        if (currentWallet) {
          setWallet(currentWallet);
          setIsConnected(true);
        } else {
          // Wallet was disconnected externally
          setWallet(null);
          setIsConnected(false);
        }
      } else {
        setWallet(null);
        setIsConnected(false);
      }
    } catch (error: any) {
      console.error('Error refreshing wallet:', error);
      
      const walletError: WalletError = {
        code: 'REFRESH_ERROR',
        message: error.message || 'Failed to refresh wallet status',
        details: error,
      };
      
      setError(walletError);
    }
  };

  const clearError = () => {
    setError(null);
  };

  const value: WalletContextType = {
    wallet,
    isConnected,
    isConnecting,
    error,
    connectWallet,
    disconnectWallet,
    refreshWallet,
    clearError,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};

// Custom hook to use wallet context
export const useWallet = (): WalletContextType => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

// Export context for advanced usage
export { WalletContext };
