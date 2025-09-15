import { 
  isConnected, 
  getAddress, 
  signTransaction, 
  setAllowed, 
  requestAccess
} from '@stellar/freighter-api';
import { 
  Transaction, 
  TransactionBuilder,
  Networks, 
  Keypair,
  Operation,
  Asset,
  BASE_FEE
} from '@stellar/stellar-sdk';
import { STELLAR_CONFIG } from '../config/stellar';

// Types for wallet operations
export interface WalletInfo {
  publicKey: string;
  isConnected: boolean;
  network: string;
  networkPassphrase: string;
}

export interface WalletError {
  code: string;
  message: string;
  details?: any;
}

export interface TransactionResult {
  success: boolean;
  hash?: string;
  error?: WalletError;
}

// Wallet service class
export class WalletService {
  private static instance: WalletService;
  private currentWallet: WalletInfo | null = null;

  private constructor() {}

  public static getInstance(): WalletService {
    if (!WalletService.instance) {
      WalletService.instance = new WalletService();
    }
    return WalletService.instance;
  }

  /**
   * Check if Freighter is installed and available
   */
  public async isFreighterAvailable(): Promise<boolean> {
    try {
      // Check if Freighter is installed by trying to access its API
      const result = await isConnected();
      return result.isConnected;
    } catch (error) {
      console.warn('Freighter not available:', error);
      return false;
    }
  }

  /**
   * Check if wallet is currently connected
   */
  public async isWalletConnected(): Promise<boolean> {
    try {
      const result = await isConnected();
      return result.isConnected;
    } catch (error) {
      console.error('Error checking wallet connection:', error);
      return false;
    }
  }

  /**
   * Connect to Freighter wallet
   */
  public async connectWallet(): Promise<WalletInfo> {
    try {
      // Check if Freighter is available
      if (!(await this.isFreighterAvailable())) {
        throw new Error('Freighter wallet is not installed. Please install Freighter to continue.');
      }

      // Request access to the wallet
      const accessResult = await requestAccess();
      if (!accessResult) {
        throw new Error('Access to Freighter wallet was denied.');
      }

      // Get public key
      const addressResult = await getAddress();
      if (!addressResult.address) {
        throw new Error('Failed to get public key from wallet.');
      }
      const publicKey = addressResult.address;

      // Create wallet info object
      const walletInfo: WalletInfo = {
        publicKey,
        isConnected: true,
        network: STELLAR_CONFIG.network === Networks.PUBLIC ? 'mainnet' : 'testnet',
        networkPassphrase: STELLAR_CONFIG.networkPassphrase,
      };

      this.currentWallet = walletInfo;
      return walletInfo;

    } catch (error: any) {
      console.error('Error connecting to wallet:', error);
      throw new Error(error.message || 'Failed to connect to wallet');
    }
  }

  /**
   * Disconnect from wallet
   */
  public async disconnectWallet(): Promise<void> {
    try {
      // Revoke access completely
      await setAllowed();
      this.currentWallet = null;
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
      // Even if there's an error, clear the local state
      this.currentWallet = null;
    }
  }

  /**
   * Get current wallet information
   */
  public getCurrentWallet(): WalletInfo | null {
    return this.currentWallet;
  }

  /**
   * Set current wallet information (for persistence)
   */
  public setCurrentWallet(walletInfo: WalletInfo): void {
    this.currentWallet = walletInfo;
  }

  /**
   * Get address from Freighter (for verification)
   */
  public async getAddress(): Promise<{ address: string }> {
    try {
      return await getAddress();
    } catch (error) {
      console.error('Error getting address:', error);
      throw error;
    }
  }

  /**
   * Get user info from Freighter (simplified version)
   */
  public async getUserInfo(): Promise<any> {
    try {
      if (!(await this.isWalletConnected())) {
        throw new Error('Wallet is not connected');
      }
      // Return basic wallet info since getUserInfo is not available in the API
      return {
        publicKey: this.currentWallet?.publicKey,
        network: this.currentWallet?.network,
      };
    } catch (error) {
      console.error('Error getting user info:', error);
      throw error;
    }
  }

  /**
   * Sign a transaction
   */
  public async signTransaction(transaction: Transaction): Promise<TransactionResult> {
    try {
      if (!this.currentWallet?.isConnected) {
        throw new Error('Wallet is not connected');
      }

      // Convert transaction to XDR
      const transactionXdr = transaction.toXDR();
      
      // Sign with Freighter
      const signResult = await signTransaction(transactionXdr, {
        networkPassphrase: STELLAR_CONFIG.networkPassphrase,
      });

      // Parse the signed transaction
      const signedTransaction = TransactionBuilder.fromXDR(signResult.signedTxXdr, STELLAR_CONFIG.networkPassphrase);
      
      return {
        success: true,
        hash: signedTransaction.hash().toString('hex'),
      };

    } catch (error: any) {
      console.error('Error signing transaction:', error);
      return {
        success: false,
        error: {
          code: 'SIGN_ERROR',
          message: error.message || 'Failed to sign transaction',
          details: error,
        },
      };
    }
  }

  /**
   * Create a simple payment transaction
   */
  public async createPaymentTransaction(
    destination: string,
    amount: string,
    asset: Asset = Asset.native()
  ): Promise<Transaction> {
    try {
      if (!this.currentWallet?.isConnected) {
        throw new Error('Wallet is not connected');
      }

      // For now, return a basic transaction structure
      // In a real implementation, you would fetch account details from Horizon
      const keypair = Keypair.fromPublicKey(this.currentWallet.publicKey);
      
      // Create a mock account for transaction building
      const account = {
        accountId: this.currentWallet.publicKey,
        sequenceNumber: '0',
        incrementSequenceNumber: () => {}
      };
      
      const transaction = new TransactionBuilder(account as any, {
        fee: BASE_FEE,
        networkPassphrase: STELLAR_CONFIG.networkPassphrase,
      })
        .addOperation(
          Operation.payment({
            destination,
            asset,
            amount,
          })
        )
        .setTimeout(30)
        .build();

      return transaction;

    } catch (error) {
      console.error('Error creating payment transaction:', error);
      throw error;
    }
  }

  /**
   * Get account balance (placeholder - would need Horizon integration)
   */
  public async getAccountBalance(): Promise<any> {
    try {
      if (!this.currentWallet?.isConnected) {
        throw new Error('Wallet is not connected');
      }

      // This would require Horizon server integration
      // For now, return a placeholder
      return {
        balances: [],
        message: 'Balance fetching requires Horizon integration'
      };

    } catch (error) {
      console.error('Error getting account balance:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const walletService = WalletService.getInstance();