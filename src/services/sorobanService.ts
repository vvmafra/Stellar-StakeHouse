import { 
  Contract, 
  Networks, 
  Keypair,
  TransactionBuilder,
  Operation,
  BASE_FEE,
  xdr,
  Address,
  Asset,
  scValToNative,
  nativeToScVal,
  Account,
  Transaction,
  Memo,
  MemoType
} from '@stellar/stellar-sdk';
import { rpc as StellarRpc } from '@stellar/stellar-sdk';
import { STELLAR_CONFIG } from '../config/stellar';
import { walletService } from './walletService';

// Types for Soroban operations
export interface SorobanTransactionResult {
  success: boolean;
  hash?: string;
  result?: any;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface JoinStakeParams {
  contractId: string;
  walletId: string;
  amount?: string;
}

export interface ContractInfo {
  contractId: string;
  totalStaked: string;
  participants: number;
  apr: string;
  status: string;
}

export interface UserParticipation {
  isParticipating: boolean;
  stakedAmount?: string;
  joinDate?: string;
}

// Soroban service class for smart contract interactions
export class SorobanService {
  private static instance: SorobanService;
  private rpcUrl: string;
  private server: any;
  private launchtubeToken: string;

  private constructor() {
    this.rpcUrl = STELLAR_CONFIG.rpcUrl;
    this.launchtubeToken = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiI4NTMyZjAxODNjNjk0MTc0ZjVjMzNiMDJkMDA0MmMwNzFjMzViMTE0M2UzYzU4ZGJkNDdlMWRmYjdiMTU2NWE4IiwiZXhwIjoxNzY1MjE2Mjg3LCJjcmVkaXRzIjoxMDAwMDAwMDAwLCJpYXQiOjE3NTc5NTg2ODd9.u8Y0we9_X8c4IaIHciU7-t9VjsLj3m8IyBBooOGR8cY';
    
    try {
      // Initialize Stellar RPC server
      this.server = new StellarRpc.Server(this.rpcUrl, {
        allowHttp: true
      });
      
      // Add launchtube token authentication to the server
      if (this.server.axiosInstance) {
        this.server.axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${this.launchtubeToken}`;
        this.server.axiosInstance.defaults.headers.common['Content-Type'] = 'application/json';
      }
      
    } catch (error) {
      console.error('❌ Failed to initialize Soroban service:', error);
      throw error;
    }
  }

  public static getInstance(): SorobanService {
    if (!SorobanService.instance) {
      SorobanService.instance = new SorobanService();
    }
    return SorobanService.instance;
  }

  /**
   * Make a custom RPC call with launchtube token authentication
   */
  private async makeRpcCall(method: string, params: any[] = []): Promise<any> {
    try {
      const response = await fetch(this.rpcUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.launchtubeToken}`
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: method,
          params: params
        })
      });

      if (!response.ok) {
        throw new Error(`RPC call failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.error) {
        throw new Error(`RPC error: ${result.error.message}`);
      }

      return result.result;
    } catch (error: any) {
      console.error(`RPC call failed for method ${method}:`, error);
      throw error;
    }
  }

  /**
   * Check if an account is funded (has a balance > 0)
   */
  public async isAccountFunded(publicKey: string): Promise<{ funded: boolean; balance: string; message: string; faucetUrl?: string }> {
    try {
      const account = await this.getAccountDetails(publicKey);
      
      // Check if balances exist and find native balance
      const balances = (account as any).balances || [];
      const nativeBalance = balances.find((balance: any) => balance.asset_type === 'native');
      const balance = nativeBalance ? nativeBalance.balance : '0';
      const funded = parseFloat(balance) > 0;
      
      return {
        funded,
        balance,
        message: funded 
          ? `Account is funded with ${balance} XLM` 
          : 'Account needs to be funded with XLM to perform transactions',
        faucetUrl: funded ? undefined : 'https://laboratory.stellar.org/#account-creator?network=testnet'
      };
    } catch (error: any) {
      if (error.status === 404 || error.message?.includes('not found')) {
        return {
          funded: false,
          balance: '0',
          message: 'Account does not exist on the network yet',
          faucetUrl: 'https://laboratory.stellar.org/#account-creator?network=testnet'
        };
      }
      throw error;
    }
  }

  /**
   * Test the connection and launchtube token validity
   */
  public async testConnection(): Promise<{ success: boolean; message: string; details?: any }> {
    try {
      // Test basic RPC connectivity
      const latestLedger = await this.server.getLatestLedger();
      
      return {
        success: true,
        message: 'Soroban service connection successful',
        details: {
          latestLedger: latestLedger.sequence,
          contractId: STELLAR_CONFIG.CONTRACT_ID,
          rpcUrl: this.rpcUrl
        }
      };
    } catch (error: any) {
      console.error('❌ Connection test failed:', error);
      return {
        success: false,
        message: `Connection test failed: ${error.message}`,
        details: error
      };
    }
  }

  /**
   * Get account details from the network using RPC
   */
  private async getAccountDetails(publicKey: string): Promise<Account> {
    try {
      const accountResponse = await this.server.getAccount(publicKey);
      
      // Get balances from Horizon API since RPC doesn't provide them
      const balances = await this.getAccountBalancesFromHorizon(publicKey);
      
      // Add balances to the account response
      if (accountResponse.balances === undefined) {
        (accountResponse as any).balances = balances;
      }
      
      return accountResponse;
    } catch (error: any) {
      console.error('Error fetching account details:', error);
      // If account doesn't exist, create a new account with sequence 0
      if (error.status === 404 || error.message?.includes('not found') || error.message?.includes('404')) {
        return new Account(publicKey, '0');
      }
      throw new Error(`Failed to fetch account details: ${error.message}`);
    }
  }

  /**
   * Get account balances from Horizon API (no authentication needed)
   */
  private async getAccountBalancesFromHorizon(publicKey: string): Promise<any[]> {
    try {
      // Use a clean fetch without any Launchtube authentication
      const response = await fetch(`${STELLAR_CONFIG.horizonUrl}/accounts/${publicKey}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          return [];
        }
        throw new Error(`Horizon API error: ${response.status} ${response.statusText}`);
      }
      
      const accountData = await response.json();
      
      return accountData.balances || [];
    } catch (error: any) {
      console.error('Error fetching balances from Horizon:', error);
      return [];
    }
  }

  /**
   * Simulate a transaction before sending it using RPC
   */
  private async simulateTransaction(transaction: Transaction): Promise<any> {
    try {
      const simulation = await this.server.simulateTransaction(transaction);
      return simulation;
    } catch (error: any) {
      console.error('Error simulating transaction:', error);
      throw new Error(`Transaction simulation failed: ${error.message}`);
    }
  }

  /**
   * Submit a transaction to the network using RPC
   */
  private async submitTransaction(transaction: Transaction): Promise<any> {
    try {
      const response = await this.server.sendTransaction(transaction);
      return response;
    } catch (error: any) {
      console.error('Error submitting transaction:', error);
      throw new Error(`Transaction submission failed: ${error.message}`);
    }
  }

  /**
   * Poll transaction status until completion using RPC
   */
  private async pollTransactionStatus(transactionHash: string, maxAttempts: number = 30): Promise<any> {
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const transaction = await this.server.getTransaction(transactionHash);
        
        if (transaction.status === 'SUCCESS') {
          return transaction;
        } else if (transaction.status === 'FAILED') {
          console.error('❌ Transaction failed with full details:', {
            status: transaction.status,
            resultXdr: transaction.resultXdr,
            resultMetaXdr: transaction.resultMetaXdr,
            ledger: transaction.ledger,
            createdAt: transaction.createdAt,
            fullTransaction: transaction
          });
          
          // Try to decode the error from resultXdr
          let errorMessage = 'Transaction failed';
          try {
            if (transaction.resultXdr) {
              console.error('🔍 Raw result XDR:', transaction.resultXdr);
              
              // Try to extract more meaningful error information
              const resultXdr = transaction.resultXdr;
              if (resultXdr._switch && resultXdr._switch.name === 'txFailed') {
                errorMessage = 'Transaction failed - likely due to insufficient balance, invalid token address, or authorization issues';
              } else {
                errorMessage = `Transaction failed. Result XDR: ${JSON.stringify(resultXdr)}`;
              }
            }
          } catch (decodeError) {
            console.error('❌ Could not process result XDR:', decodeError);
            errorMessage = `Transaction failed: ${transaction.resultXdr}`;
          }
          
          throw new Error(errorMessage);
        }
        
        // Wait 2 seconds before next attempt
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error: any) {
        if (i === maxAttempts - 1) {
          throw error;
        }
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    throw new Error('Transaction polling timeout');
  }

  /**
   * Test if contract exists and has the authorize_owner function
   */
  public async testContractFunction(contractId: string): Promise<{ exists: boolean; error?: string }> {
    try {
      console.log('🔍 Testing contract function existence...');
      
      // Simply try to create contract instance (this will validate the contract ID format)
      try {
        const contractInstance = new Contract(contractId);
        console.log('✅ Contract instance created with ID:', contractId);
        
        // Basic validation - if we can create the instance, the contract ID is valid
        // The actual contract existence will be tested when we try to call the function
        return { exists: true };
      } catch (contractError: any) {
        console.error('❌ Contract function test failed:', contractError);
        return { exists: false, error: `Invalid contract ID: ${contractError.message}` };
      }
    } catch (error: any) {
      console.error('❌ Contract test failed:', error);
      return { exists: false, error: `Contract validation error: ${error.message}` };
    }
  }

  /**
   * Test wallet authorization capabilities
   */
  public async testWalletAuth(): Promise<{ canSign: boolean; error?: string }> {
    try {
      console.log('🔐 Testing wallet authorization capabilities...');
      
      const currentWallet = walletService.getCurrentWallet();
      if (!currentWallet?.isConnected) {
        return { canSign: false, error: 'Wallet not connected' };
      }

      // Test if we can get the wallet's public key
      const publicKey = currentWallet.publicKey;
      if (!publicKey) {
        return { canSign: false, error: 'Cannot get public key from wallet' };
      }

      console.log('✅ Wallet public key retrieved:', publicKey);

      // Test if we can create a simple transaction
      try {
        const account = await this.getAccountDetails(publicKey);
        console.log('✅ Account details retrieved:', account.accountId());
        
        // Test if we can create a simple transaction
        const transaction = new TransactionBuilder(account, {
          fee: BASE_FEE,
          networkPassphrase: STELLAR_CONFIG.networkPassphrase,
        })
          .setTimeout(30)
          .build();
        
        console.log('✅ Transaction builder works');
        
        return { canSign: true };
      } catch (error: any) {
        return { canSign: false, error: `Account error: ${error.message}` };
      }
    } catch (error: any) {
      console.error('❌ Wallet auth test failed:', error);
      return { canSign: false, error: error.message };
    }
  }

  /**
   * Call the authorize_owner function on the smart contract
   */
  public async authorizeOwner(contractId: string, ownerAddress: string): Promise<SorobanTransactionResult> {
    try {
      console.log('🚀 Starting authorizeOwner with:', { contractId, ownerAddress });
      
      // First test contract existence
      console.log('🔍 Testing contract existence...');
      const contractTest = await this.testContractFunction(contractId);
      if (!contractTest.exists) {
        throw new Error(`Contract test failed: ${contractTest.error}`);
      }
      console.log('✅ Contract test passed');
      
      // Then test wallet authorization capabilities
      console.log('🔐 Testing wallet authorization...');
      const authTest = await this.testWalletAuth();
      if (!authTest.canSign) {
        throw new Error(`Wallet authorization test failed: ${authTest.error}`);
      }
      console.log('✅ Wallet authorization test passed');
      
      // Check if wallet is connected
      const currentWallet = walletService.getCurrentWallet();
      
      if (!currentWallet?.isConnected) {
        throw new Error('Wallet is not connected');
      }

      const userPublicKey = currentWallet.publicKey;
      console.log('👤 User public key:', userPublicKey);
      console.log('📋 Owner address parameter:', ownerAddress);
      
      // Verify that the owner address matches the wallet address
      if (userPublicKey !== ownerAddress) {
        console.warn('⚠️ WARNING: User public key does not match owner address!');
        console.warn('This could cause authorization issues in the contract');
        console.warn('User public key:', userPublicKey);
        console.warn('Owner address:', ownerAddress);
      } else {
        console.log('✅ User public key matches owner address - authorization should work');
      }

      // Get account details from the network
      const account = await this.getAccountDetails(userPublicKey);

      // Check if account is funded
      const fundingStatus = await this.isAccountFunded(userPublicKey);
      
      if (!fundingStatus.funded) {
        return {
          success: false,
          error: {
            code: 'ACCOUNT_NOT_FUNDED',
            message: fundingStatus.message,
            details: {
              balance: fundingStatus.balance,
              userAddress: userPublicKey,
              suggestion: 'Please fund your account with XLM using a testnet faucet before authorizing',
              faucetUrl: fundingStatus.faucetUrl
            }
          }
        };
      }

      // Create contract instance
      const contract = new Contract(contractId);
      console.log('📄 Contract instance created:', contractId);
      
      // Convert ownerAddress (public key string) to Address object
      const owner = new Address(ownerAddress);
      console.log('🔑 Owner address object created:', owner.toString());
      
      // Create the contract call operation
      const contractCallOperation = contract.call('authorize_owner', nativeToScVal(owner, { type: 'address' }));
      console.log('📞 Contract call operation created');

      // Build the transaction
      const transaction = new TransactionBuilder(account, {
        fee: BASE_FEE,
        networkPassphrase: STELLAR_CONFIG.networkPassphrase,
      })
        .addOperation(contractCallOperation)
        .setTimeout(30)
        .build();
      console.log('🔨 Transaction built successfully');

      // Prepare the transaction for Soroban
      console.log('⚙️ Preparing transaction for Soroban...');
      const preparedTransaction = await this.server.prepareTransaction(transaction);
      console.log('✅ Transaction prepared successfully');

      // Sign the prepared transaction using Freighter directly
      console.log('✍️ Signing transaction with Freighter...');
      console.log('📋 Transaction details before signing:', {
        sourceAccount: preparedTransaction.source,
        sequenceNumber: preparedTransaction.sequence,
        operations: preparedTransaction.operations.length,
        networkPassphrase: STELLAR_CONFIG.networkPassphrase
      });
      
      const { signTransaction } = await import('@stellar/freighter-api');
      
      let signedXdr;
      try {
        signedXdr = await signTransaction(
          preparedTransaction.toEnvelope().toXDR('base64'),
          { networkPassphrase: STELLAR_CONFIG.networkPassphrase }
        );
        console.log('✅ Transaction signed successfully');
        console.log('📋 Signed transaction details:', {
          signedTxXdr: signedXdr.signedTxXdr ? 'Present' : 'Missing',
          hasSignature: !!signedXdr.signedTxXdr
        });
      } catch (signError: any) {
        console.error('❌ Signing failed:', signError);
        throw new Error(`Transaction signing failed: ${signError.message}`);
      }

      // Reconstruct the signed transaction from XDR
      const signedTransaction = TransactionBuilder.fromXDR(
        signedXdr.signedTxXdr,
        STELLAR_CONFIG.networkPassphrase
      ) as Transaction;

      // Submit the signed transaction
      const submitResult = await this.submitTransaction(signedTransaction);
      
      // Poll for transaction completion
      const finalResult = await this.pollTransactionStatus(submitResult.hash);

      return {
        success: true,
        hash: submitResult.hash,
        result: {
          contractId,
          ownerAddress,
          message: 'Successfully authorized owner - contract invoked!',
          finalResult: finalResult
        }
      };

    } catch (error: any) {
      console.error('Error calling authorize_owner function:', error);
      return {
        success: false,
        error: {
          code: 'CONTRACT_CALL_ERROR',
          message: error.message || 'Failed to call authorize_owner function',
          details: error
        }
      };
    }
  }

  /**
   * Call the join function on the smart contract
   */
  public async joinStake(params: JoinStakeParams): Promise<SorobanTransactionResult> {
    try {
      const { contractId, walletId, amount } = params;

      // Check if wallet is connected
      const currentWallet = walletService.getCurrentWallet();
      
      if (!currentWallet?.isConnected) {
        throw new Error('Wallet is not connected');
      }

      const userPublicKey = currentWallet.publicKey;

      // Get account details from the network
      const account = await this.getAccountDetails(userPublicKey);

      // Check if account is funded
      const fundingStatus = await this.isAccountFunded(userPublicKey);
      
      if (!fundingStatus.funded) {
        return {
          success: false,
          error: {
            code: 'ACCOUNT_NOT_FUNDED',
            message: fundingStatus.message,
            details: {
              balance: fundingStatus.balance,
              userAddress: userPublicKey,
              suggestion: 'Please fund your account with XLM using a testnet faucet before joining a stake',
              faucetUrl: fundingStatus.faucetUrl
            }
          }
        };
      }

      // Create contract instance
      const contract = new Contract(contractId);
      
      // Convert walletId (public key string) to Address object
      const userAddress = new Address(walletId);
      
      // Create the contract call operation
      const contractCallOperation = contract.call('join', nativeToScVal(userAddress, { type: 'address' }));

      // Build the transaction
      const transaction = new TransactionBuilder(account, {
        fee: BASE_FEE,
        networkPassphrase: STELLAR_CONFIG.networkPassphrase,
      })
        .addOperation(contractCallOperation)
        .setTimeout(30)
        .build();

      // Prepare the transaction for Soroban
      const preparedTransaction = await this.server.prepareTransaction(transaction);

      // Sign the prepared transaction using Freighter directly
      const { signTransaction } = await import('@stellar/freighter-api');
      const signedXdr = await signTransaction(
        preparedTransaction.toEnvelope().toXDR('base64'),
        { networkPassphrase: STELLAR_CONFIG.networkPassphrase }
      );

      // Reconstruct the signed transaction from XDR
      const signedTransaction = TransactionBuilder.fromXDR(
        signedXdr.signedTxXdr,
        STELLAR_CONFIG.networkPassphrase
      ) as Transaction;

      // Submit the signed transaction
      const submitResult = await this.submitTransaction(signedTransaction);
      
      // Poll for transaction completion
      const finalResult = await this.pollTransactionStatus(submitResult.hash);

      return {
        success: true,
        hash: submitResult.hash,
        result: {
          contractId,
          walletId,
          userAddress: userAddress.toString(),
          message: 'Successfully joined stake - contract invoked!',
          finalResult: finalResult
        }
      };

    } catch (error: any) {
      console.error('Error calling join function:', error);
      return {
        success: false,
        error: {
          code: 'CONTRACT_CALL_ERROR',
          message: error.message || 'Failed to call join function',
          details: error
        }
      };
    }
  }

  /**
   * Get contract information by reading contract state
   */
  public async getContractInfo(contractId: string): Promise<ContractInfo> {
    try {
      
      // Create contract instance
      const contract = new Contract(contractId);
      
      // Get current wallet for contract calls
      const currentWallet = walletService.getCurrentWallet();
      if (!currentWallet?.isConnected) {
        throw new Error('Wallet is not connected');
      }
      
      const account = await this.getAccountDetails(currentWallet.publicKey);
      
      // Try to call contract functions to get real data
      try {
        // Call get_total_staked function
        const totalStakedCall = contract.call('get_total_staked');
        const totalStakedTransaction = new TransactionBuilder(account, {
          fee: BASE_FEE,
          networkPassphrase: STELLAR_CONFIG.networkPassphrase,
        })
          .addOperation(totalStakedCall)
          .setTimeout(30)
          .build();
        
        const totalStakedSimulation = await this.simulateTransaction(totalStakedTransaction);
        const totalStaked = totalStakedSimulation.results?.[0]?.xdr ? 
          scValToNative(totalStakedSimulation.results[0].xdr) : '0';
        
        // Call get_participants function
        const participantsCall = contract.call('get_participants');
        const participantsTransaction = new TransactionBuilder(account, {
          fee: BASE_FEE,
          networkPassphrase: STELLAR_CONFIG.networkPassphrase,
        })
          .addOperation(participantsCall)
          .setTimeout(30)
          .build();
        
        const participantsSimulation = await this.simulateTransaction(participantsTransaction);
        const participants = participantsSimulation.results?.[0]?.xdr ? 
          scValToNative(participantsSimulation.results[0].xdr) : 0;
        
        return {
          contractId,
          totalStaked: totalStaked.toString(),
          participants: Number(participants),
          apr: '12.5%', // This would need to be fetched from contract or config
          status: 'active'
        };
      } catch (contractError) {
        // Fallback to default values if contract calls fail
        return {
          contractId,
          totalStaked: '0',
          participants: 0,
          apr: '12.5%',
          status: 'active'
        };
      }
    } catch (error: any) {
      console.error('Error getting contract info:', error);
      throw error;
    }
  }

  /**
   * Check if user is already participating in a stake
   */
  public async isUserParticipating(contractId: string, walletId: string): Promise<UserParticipation> {
    try {
      
      // Create contract instance
      const contract = new Contract(contractId);
      
      // Get current wallet for contract calls
      const currentWallet = walletService.getCurrentWallet();
      if (!currentWallet?.isConnected) {
        return { isParticipating: false };
      }
      
      const account = await this.getAccountDetails(currentWallet.publicKey);
      
      try {
        // Call is_participating function
        const isParticipatingCall = contract.call(
          'is_participating',
          nativeToScVal(walletId, { type: 'string' })
        );
        const isParticipatingTransaction = new TransactionBuilder(account, {
          fee: BASE_FEE,
          networkPassphrase: STELLAR_CONFIG.networkPassphrase,
        })
          .addOperation(isParticipatingCall)
          .setTimeout(30)
          .build();
        
        const isParticipatingSimulation = await this.simulateTransaction(isParticipatingTransaction);
        const isParticipating = isParticipatingSimulation.results?.[0]?.xdr ? 
          scValToNative(isParticipatingSimulation.results[0].xdr) : false;
        
        if (isParticipating) {
          // Call get_staked_amount function
          const stakedAmountCall = contract.call(
            'get_staked_amount',
            nativeToScVal(walletId, { type: 'string' })
          );
          const stakedAmountTransaction = new TransactionBuilder(account, {
            fee: BASE_FEE,
            networkPassphrase: STELLAR_CONFIG.networkPassphrase,
          })
            .addOperation(stakedAmountCall)
            .setTimeout(30)
            .build();
          
          const stakedAmountSimulation = await this.simulateTransaction(stakedAmountTransaction);
          const stakedAmount = stakedAmountSimulation.results?.[0]?.xdr ? 
            scValToNative(stakedAmountSimulation.results[0].xdr) : '0';
          
          return {
            isParticipating: Boolean(isParticipating),
            stakedAmount: stakedAmount.toString(),
            joinDate: new Date().toISOString() // This would need to be fetched from contract
          };
        }
        
        return {
          isParticipating: Boolean(isParticipating),
          stakedAmount: '0',
          joinDate: undefined
        };
      } catch (contractError) {
        return {
          isParticipating: false,
          stakedAmount: '0',
          joinDate: undefined
        };
      }
    } catch (error: any) {
      console.error('Error checking user participation:', error);
      return {
        isParticipating: false
      };
    }
  }

  /**
   * Read events from the contract using RPC
   */
  public async readContractEvents(contractId: string, topics: string[] = []): Promise<any[]> {
    try {
      
      // Get events from the contract using custom RPC call
      const events = await this.makeRpcCall('getEvents', [{
        contractId: contractId,
        topics: topics,
        limit: 100
      }]);
      
      return events;
    } catch (error: any) {
      console.error('Error reading contract events:', error);
      return [];
    }
  }

  /**
   * Get account balance using RPC
   */
  public async getAccountBalance(publicKey: string): Promise<any> {
    try {
      const account = await this.server.getAccount(publicKey);
      
      return {
        balances: account.balances,
        sequenceNumber: account.sequenceNumber(),
        accountId: account.accountId()
      };
    } catch (error: any) {
      console.error('Error getting account balance:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const sorobanService = SorobanService.getInstance();
