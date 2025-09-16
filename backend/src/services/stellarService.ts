import { Networks, Keypair, TransactionBuilder, Operation, Asset, BASE_FEE, Contract, Address, nativeToScVal, scValToNative, Account } from '@stellar/stellar-sdk';
import { rpc as StellarRpc } from '@stellar/stellar-sdk';
import { logger } from '../utils/logger.js';

class StellarService {
  private server: StellarRpc.Server;
  private network: string;
  private networkPassphrase: string;

  constructor() {
    this.network = process.env.STELLAR_NETWORK || 'testnet';
    const rpcUrl = process.env.STELLAR_SOROBAN_RPC_URL || 'https://soroban-testnet.stellar.org';
    
    this.server = new StellarRpc.Server(rpcUrl);
    
    // Configurar rede e passphrase
    if (this.network === 'testnet') {
      this.networkPassphrase = Networks.TESTNET;
    } else {
      this.networkPassphrase = Networks.PUBLIC;
    }

    logger.info(`🌐 Connected to Stellar ${this.network} network (RPC: ${rpcUrl})`);
  }

  /**
   * Busca stakes expirados
   */
  async getExpiredStakes() {
    try {
      logger.info('🔍 Fetching expired stakes from Stellar...');
      
      // TODO: Implementar busca de stakes expirados
      // 1. Conectar com o contrato Soroban
      // 2. Buscar stakes próximos do vencimento
      // 3. Verificar quais já expiraram
      
      // Placeholder - retorna array vazio por enquanto
      const expiredStakes: any[] = [];
      
      logger.info(`📊 Found ${expiredStakes.length} expired stakes`);
      return expiredStakes;
      
    } catch (error) {
      logger.error('❌ Error fetching expired stakes:', error);
      throw error;
    }
  }

  /**
   * Sincroniza dados com a rede Stellar
   */
  async syncWithNetwork() {
    try {
      logger.info('🔄 Syncing with Stellar network...');
      
      // TODO: Implementar sincronização
      // 1. Buscar transações recentes do contrato
      // 2. Atualizar estados locais
      // 3. Verificar mudanças de saldo
      
      const result = {
        transactionsProcessed: 0,
        lastSyncTime: new Date().toISOString()
      };
      
      logger.info('✅ Sync completed successfully');
      return result;
      
    } catch (error) {
      logger.error('❌ Error syncing with network:', error);
      throw error;
    }
  }

  /**
   * Limpa dados antigos
   */
  async cleanupOldData() {
    try {
      logger.info('🧹 Cleaning up old data...');
      
      // TODO: Implementar limpeza
      // 1. Remover logs antigos
      // 2. Limpar cache expirado
      // 3. Otimizar armazenamento
      
      const result = {
        itemsRemoved: 0,
        spaceFreed: '0 MB'
      };
      
      logger.info('✅ Cleanup completed successfully');
      return result;
      
    } catch (error) {
      logger.error('❌ Error during cleanup:', error);
      throw error;
    }
  }

  /**
   * Verifica status da conexão com Stellar
   */
  async checkConnection() {
    try {
      // Testa a conexão fazendo uma requisição simples
      const latestLedger = await this.server.getLatestLedger();
      return {
        connected: true,
        network: this.network,
        rpcUrl: this.server.serverURL,
        latestLedger: latestLedger.sequence
      };
    } catch (error) {
      logger.error('❌ Error checking Stellar connection:', error);
      return {
        connected: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Busca informações de uma conta
   */
  async getAccountInfo(publicKey: string) {
    try {
      const account = await this.server.getAccount(publicKey);
      return {
        accountId: account.accountId(),
        sequenceNumber: account.sequenceNumber(),
        balances: (account as any).balances || [],
        subentryCount: (account as any).subentryCount || 0
      };
    } catch (error) {
      logger.error(`❌ Error fetching account ${publicKey}:`, error);
      throw error;
    }
  }

  /**
   * Busca transações recentes de uma conta
   */
  async getRecentTransactions(publicKey: string, limit: number = 10) {
    try {
      const latestLedger = await this.server.getLatestLedger();
      const transactions = await this.server.getTransactions({
        startLedger: Math.max(1, latestLedger.sequence - 1000), // Last ~1000 ledgers
        limit: limit
      });
      return (transactions as any).records || [];
    } catch (error) {
      logger.error(`❌ Error fetching transactions for ${publicKey}:`, error);
      throw error;
    }
  }

  /**
   * Cria uma transação de pagamento
   */
  async createPaymentTransaction(sourcePublicKey: string, destination: string, amount: string, asset: string = 'XLM') {
    try {
      const sourceAccount = await this.server.getAccount(sourcePublicKey);
      
      const paymentAsset = asset === 'XLM' ? Asset.native() : new Asset(asset, sourcePublicKey);
      
      const transaction = new TransactionBuilder(sourceAccount, {
        fee: BASE_FEE,
        networkPassphrase: this.networkPassphrase,
      })
        .addOperation(
          Operation.payment({
            destination: destination,
            asset: paymentAsset,
            amount: amount,
          })
        )
        .setTimeout(30)
        .build();

      return transaction;
    } catch (error) {
      logger.error('❌ Error creating payment transaction:', error);
      throw error;
    }
  }

  /**
   * Envia uma transação assinada
   */
  async sendTransaction(signedTransaction: any) {
    try {
      const result = await this.server.sendTransaction(signedTransaction);
      logger.info('✅ Transaction sent successfully:', result.hash);
      return result;
    } catch (error) {
      logger.error('❌ Error sending transaction:', error);
      throw error;
    }
  }

  /**
   * Chama função get_owner do contrato
   */
  async getOwner(contractAddress: string) {
    try {
      logger.info(`🔍 Getting owner from contract: ${contractAddress}`);
      
      // TODO: Implementar chamada para o contrato Soroban
      // Por enquanto retorna um placeholder
      const owner = {
        address: 'placeholder_owner_address',
        balance: '1000000' // 1 XLM em stroops
      };
      
      logger.info(`✅ Owner retrieved: ${owner.address} with balance: ${owner.balance}`);
      return owner;
    } catch (error) {
      logger.error('❌ Error getting owner:', error);
      throw error;
    }
  }

  /**
   * Chama função get_participants do contrato
   */
  async getParticipants(contractAddress: string) {
    try {
      logger.info(`🔍 Getting participants from contract: ${contractAddress}`);
      
      // TODO: Implementar chamada para o contrato Soroban
      // Por enquanto retorna endereços válidos do Stellar para teste
      const participants = [
        { address: 'GB3DNN3EMSTHKPFD5P6UCTSSIAHNL7UZC2QBUYNHYEKOUCUX6YJR3WGS', stake: '100000' },
        { address: 'GBZGAMPLCDROH5CGEJ2EUY52LTK5YSBUIIASRMKLH6IKOJNUHXWBL3RW', stake: '200000' },
        { address: 'GCNY5OXYSY4FKHOPT2SPOQZAOEIGXB5LBYW3HVU3OWEOTOFKNC2Q5WFL', stake: '150000' }
      ];
      
      logger.info(`✅ Found ${participants.length} participants`);
      return participants;
    } catch (error) {
      logger.error('❌ Error getting participants:', error);
      throw error;
    }
  }

  /**
   * Chama função calculate_APR do contrato
   */
  async calculateAPR(contractAddress: string, ownerBalance: string, totalStakes: number) {
    try {
      logger.info(`🧮 Calculating APR for contract: ${contractAddress}`);
      logger.info(`💰 Owner balance: ${ownerBalance} stroops, Total stakes: ${totalStakes} stroops`);
      
      // TODO: Implementar chamada para o contrato Soroban
      // Por enquanto retorna um placeholder com cálculo baseado nos valores
      const ownerBalanceNum = parseFloat(ownerBalance);
      
      // Cálculo de exemplo: APR baseado na proporção dos stakes vs owner balance
      // APR = (total stakes / owner balance) * 100%
      const aprRate = ownerBalanceNum > 0 ? (totalStakes / ownerBalanceNum) : 0.05; // Proporção direta
      
      const apr = {
        rate: aprRate,
        dailyRate: aprRate / 365,
        ownerBalance: ownerBalance,
        totalStakes: totalStakes,
      };
      
      logger.info(`✅ APR calculated: ${(apr.rate * 100).toFixed(2)}%`);
      return apr;
    } catch (error) {
      logger.error('❌ Error calculating APR:', error);
      throw error;
    }
  }

  /**
   * Chama função distribute do contrato
   */
  async distribute(contractAddress: string, participants: any[], aprData: any) {
    try {
      logger.info(`💰 Distributing rewards for contract: ${contractAddress}`);
      
      // TODO: Implementar chamada para o contrato Soroban
      // Por enquanto retorna um placeholder
      const distribution = {
        totalDistributed: '10000', // em stroops
        participantsRewarded: participants.length,
        timestamp: new Date().toISOString()
      };
      
      logger.info(`✅ Distribution completed: ${distribution.totalDistributed} stroops distributed to ${distribution.participantsRewarded} participants`);
      return distribution;
    } catch (error) {
      logger.error('❌ Error distributing rewards:', error);
      throw error;
    }
  }

  /**
   * Verifica saldo de token nativo usando API do Horizon
   */
  async getNativeTokenBalance(accountAddress: string) {
    try {
      logger.info(`🔍 Checking native token balance for: ${accountAddress}`);
      
      const horizonUrl = this.network === 'testnet' 
        ? 'https://horizon-testnet.stellar.org'
        : 'https://horizon.stellar.org';
      
      const response = await fetch(`${horizonUrl}/accounts/${accountAddress}`);
      
      if (!response.ok) {
        throw new Error(`Horizon API error: ${response.status} ${response.statusText}`);
      }
      
      const accountData = await response.json();
      
      // Encontrar o saldo de XLM (token nativo)
      const xlmBalance = accountData.balances.find((balance: any) => balance.asset_type === 'native');
      
      const balance = {
        address: accountAddress,
        xlmBalance: xlmBalance ? xlmBalance.balance : '0',
        hasBalance: parseFloat(xlmBalance?.balance || '0') > 0
      };
      
      logger.info(`✅ Balance retrieved: ${balance.xlmBalance} XLM (has balance: ${balance.hasBalance})`);
      return balance;
    } catch (error) {
      logger.error(`❌ Error getting balance for ${accountAddress}:`, error);
      throw error;
    }
  }

  /**
   * Verifica saldos de múltiplas contas usando API do Horizon
   */
  async getMultipleNativeTokenBalances(addresses: string[]) {
    try {
      logger.info(`🔍 Checking native token balances for ${addresses.length} addresses`);
      
      const balances = await Promise.all(
        addresses.map(address => this.getNativeTokenBalance(address))
      );
      
      const validParticipants = balances.filter(balance => balance.hasBalance);
      
      logger.info(`✅ Found ${validParticipants.length} participants with native token balance`);
      return validParticipants;
    } catch (error) {
      logger.error('❌ Error getting multiple balances:', error);
      throw error;
    }
  }

  /**
   * Transfer XLM using wallet private key with predefined values
   * @param contractAddress - The contract address
   */
  async transferFromWithContractKey(contractAddress: string) {
    try {
      logger.info(`🚀 Starting XLM transfer with wallet key:`, {
        contractAddress
      });

      // Get the private key from environment variables for the wallet
      const walletPrivateKey = process.env.WALLET_PRIVATE_KEY;
      if (!walletPrivateKey) {
        logger.error('❌ WALLET_PRIVATE_KEY environment variable not set');
        throw new Error('WALLET_PRIVATE_KEY environment variable not set. Please set it with your wallet private key.');
      }

      // Create keypair from private key
      const walletKeypair = Keypair.fromSecret(walletPrivateKey);
      
      logger.info(`🔑 Wallet keypair created successfully: ${walletKeypair.publicKey()}`);

      // Predefined values for testing
      const from = walletKeypair.publicKey(); // Transferindo da wallet
      const to = "GBZGAMPLCDROH5CGEJ2EUY52LTK5YSBUIIASRMKLH6IKOJNUHXWBL3RW"; // Endereço de destino fixo
      const amount = "10000000000"; // 10 XLM em stroops

      logger.info(`📋 Using predefined values:`, {
        from,
        to,
        amount
      });

      // Execute the XLM transfer using the wallet's private key
      logger.info('💰 Executing XLM transfer using wallet keypair...');
      const transferResult = await this.executeNativeXLMTransferWithWalletKey(from, to, amount, walletKeypair);

      logger.info('🎉 Transfer process completed successfully!', {
        transferHash: transferResult.hash,
        from,
        to,
        amount,
        contractAddress
      });

      return {
        success: true,
        transferHash: transferResult.hash,
        from,
        to,
        amount,
        contractAddress,
        type: 'wallet_transfer'
      };

    } catch (error: any) {
      logger.error('❌ Error in contract-only XLM transfer:', error);
      throw new Error(`Contract transfer failed: ${error.message}`);
    }
  }

  /**
   * Transfer XLM using only the contract's private key
   * @param contractAddress - The contract address
   * @param spender - Who is requesting the transfer (for logging)
   * @param from - Account to transfer from
   * @param to - Account to transfer to
   * @param amount - Amount in stroops
   */
  async transferFrom(contractAddress: string, spender: string, from: string, to: string, amount: string) {
    try {
      logger.info(`🚀 Starting contract-only XLM transfer:`, {
        contractAddress,
        spender,
        from,
        to,
        amount
      });

      // Get the private key from environment variables for the contract
      const contractPrivateKey = process.env.CONTRACT_PRIVATE_KEY;
      if (!contractPrivateKey) {
        logger.error('❌ CONTRACT_PRIVATE_KEY environment variable not set');
        throw new Error('CONTRACT_PRIVATE_KEY environment variable not set. Please set it with the private key of the contract.');
      }

      // Create keypair from private key
      const contractKeypair = Keypair.fromSecret(contractPrivateKey);
      
      // Verify the public key matches the contract address
      if (contractKeypair.publicKey() !== contractAddress) {
        logger.error(`❌ Private key does not match the contract address. Expected: ${contractAddress}, Got: ${contractKeypair.publicKey()}`);
        throw new Error('Private key does not match the contract address');
      }

      logger.info('🔑 Contract keypair created and verified successfully');

      // Create contract instance
      const contract = new Contract(contractAddress);
      
      // Convert addresses to Address objects
      const spenderAddress = new Address(spender);
      const fromAddress = new Address(from);
      const toAddress = new Address(to);
      const amountValue = BigInt(amount);

      logger.info(`🔑 Addresses converted:`, {
        spender: spenderAddress.toString(),
        from: fromAddress.toString(),
        to: toAddress.toString(),
        amount: amountValue.toString()
      });

      // Create the contract call operation
      const contractCallOperation = contract.call(
        'transfer_from',
        nativeToScVal(spenderAddress, { type: 'address' }), // spender
        nativeToScVal(fromAddress, { type: 'address' }),    // from
        nativeToScVal(toAddress, { type: 'address' }),      // to
        nativeToScVal(amountValue, { type: 'i128' })        // amount
      );

      logger.info('📞 Contract call operation created');

      // Get account details for the contract
      const account = await this.server.getAccount(contractAddress);
      logger.info(`👤 Account details retrieved for contract: ${account.accountId()}`);

      // Build the transaction
      const transaction = new TransactionBuilder(account, {
        fee: BASE_FEE,
        networkPassphrase: this.networkPassphrase,
      })
        .addOperation(contractCallOperation)
        .setTimeout(30)
        .build();

      logger.info('🔨 Transaction built successfully');

      // Prepare the transaction for Soroban
      logger.info('⚙️ Preparing transaction for Soroban...');
      const preparedTransaction = await this.server.prepareTransaction(transaction);
      logger.info('✅ Transaction prepared successfully');

      // Sign the transaction with the contract's keypair
      logger.info('✍️ Signing transaction with contract keypair...');
      preparedTransaction.sign(contractKeypair);
      logger.info('✅ Transaction signed successfully');

      // Submit the signed transaction
      logger.info('📤 Submitting transaction...');
      const submitResult = await this.server.sendTransaction(preparedTransaction);
      logger.info(`✅ Transaction submitted with hash: ${submitResult.hash}`);

      // Poll for transaction completion
      logger.info('⏳ Waiting for transaction confirmation...');
      const finalResult = await this.pollTransactionStatus(submitResult.hash);

      logger.info('✅ Contract validation completed successfully');

      // Now execute the actual XLM transfer using the contract's private key
      logger.info('💰 Executing actual XLM transfer using contract keypair...');
      const actualTransferResult = await this.executeNativeXLMTransferWithContractKey(from, to, amount, contractKeypair);

      logger.info('🎉 Complete transfer process completed successfully!', {
        contractHash: submitResult.hash,
        transferHash: actualTransferResult.hash,
        from,
        to,
        amount,
        contractAddress
      });

      return {
        success: true,
        contractHash: submitResult.hash,
        transferHash: actualTransferResult.hash,
        from,
        to,
        amount,
        contractAddress,
        type: 'contract_validated_transfer'
      };

    } catch (error: any) {
      logger.error('❌ Error in contract-only XLM transfer:', error);
      throw new Error(`Contract transfer failed: ${error.message}`);
    }
  }

  /**
   * Transfer XLM using transfer_from_xlm_sac contract function
   * @param contractAddress - The contract address
   * @param from - Account to transfer from
   * @param to - Account to transfer to
   * @param amount - Amount in stroops
   */
  async transferFromXlmSac(contractAddress: string, from: string, to: string, amount: string) {
    try {
      logger.info(`🚀 Starting transfer_from_xlm_sac:`, {
        contractAddress,
        from,
        to,
        amount
      });

      // Get the private key from environment variables for the contract
      const contractPrivateKey = process.env.CONTRACT_PRIVATE_KEY;
      if (!contractPrivateKey) {
        logger.error('❌ CONTRACT_PRIVATE_KEY environment variable not set');
        throw new Error('CONTRACT_PRIVATE_KEY environment variable not set. Please set it with the private key of the contract.');
      }

      // Create keypair from private key
      const contractKeypair = Keypair.fromSecret(contractPrivateKey);
      
      // Verify the public key matches the contract address
      if (contractKeypair.publicKey() !== contractAddress) {
        logger.error(`❌ Private key does not match the contract address. Expected: ${contractAddress}, Got: ${contractKeypair.publicKey()}`);
        throw new Error('Private key does not match the contract address');
      }

      logger.info('🔑 Contract keypair created and verified successfully');

      // Create contract instance
      const contract = new Contract(contractAddress);
      
      // Convert addresses to Address objects
      const fromAddress = new Address(from);
      const toAddress = new Address(to);
      const amountValue = BigInt(amount);

      logger.info(`🔑 Addresses converted:`, {
        from: fromAddress.toString(),
        to: toAddress.toString(),
        amount: amountValue.toString()
      });

      // Create the contract call operation for transfer_from_xlm_sac
      const contractCallOperation = contract.call(
        'transfer_from_xlm_sac',
        nativeToScVal(fromAddress, { type: 'address' }),    // from
        nativeToScVal(toAddress, { type: 'address' }),      // to
        nativeToScVal(amountValue, { type: 'i128' })        // amount
      );

      logger.info('📞 Contract call operation created for transfer_from_xlm_sac');

      // Get account details for the contract
      const account = await this.server.getAccount(contractAddress);
      logger.info(`👤 Account details retrieved for contract: ${account.accountId()}`);

      // Build the transaction
      const transaction = new TransactionBuilder(account, {
        fee: BASE_FEE,
        networkPassphrase: this.networkPassphrase,
      })
        .addOperation(contractCallOperation)
        .setTimeout(30)
        .build();

      logger.info('🔨 Transaction built successfully');

      // Prepare the transaction for Soroban
      logger.info('⚙️ Preparing transaction for Soroban...');
      const preparedTransaction = await this.server.prepareTransaction(transaction);
      logger.info('✅ Transaction prepared successfully');

      // Sign the transaction with the contract's keypair
      logger.info('✍️ Signing transaction with contract keypair...');
      preparedTransaction.sign(contractKeypair);
      logger.info('✅ Transaction signed successfully');

      // Submit the signed transaction
      logger.info('📤 Submitting transaction...');
      const submitResult = await this.server.sendTransaction(preparedTransaction);
      logger.info(`✅ Transaction submitted with hash: ${submitResult.hash}`);

      // Poll for transaction completion
      logger.info('⏳ Waiting for transaction confirmation...');
      const finalResult = await this.pollTransactionStatus(submitResult.hash);

      logger.info('🎉 transfer_from_xlm_sac completed successfully!', {
        contractHash: submitResult.hash,
        from,
        to,
        amount,
        contractAddress
      });

      return {
        success: true,
        contractHash: submitResult.hash,
        from,
        to,
        amount,
        contractAddress,
        type: 'transfer_from_xlm_sac'
      };

    } catch (error: any) {
      logger.error('❌ Error in transfer_from_xlm_sac:', error);
      throw new Error(`transfer_from_xlm_sac failed: ${error.message}`);
    }
  }

  /**
   * Execute native XLM transfer using wallet's private key
   */
  private async executeNativeXLMTransferWithWalletKey(from: string, to: string, amount: string, walletKeypair: any) {
    try {
      // Create a payment transaction from the wallet to the destination
      const paymentTransaction = await this.createPaymentTransaction(walletKeypair.publicKey(), to, amount, 'XLM');
      
      logger.info('🔨 Native payment transaction created successfully');

      // Sign the transaction with the wallet's keypair
      logger.info('✍️ Signing native payment transaction with wallet keypair...');
      paymentTransaction.sign(walletKeypair);
      logger.info('✅ Native payment transaction signed successfully');

      // Submit the transaction
      logger.info('📤 Submitting native payment transaction...');
      const submitResult = await this.sendTransaction(paymentTransaction);
      
      logger.info('✅ Native XLM transfer submitted successfully!', {
        hash: submitResult.hash,
        from: walletKeypair.publicKey(),
        to,
        amount
      });

      return {
        success: true,
        hash: submitResult.hash,
        from: walletKeypair.publicKey(),
        to,
        amount
      };

    } catch (error: any) {
      logger.error('❌ Error in native XLM transfer with wallet key:', error);
      throw new Error(`Native transfer failed: ${error.message}`);
    }
  }

  /**
   * Execute native XLM transfer using contract's private key
   */
  private async executeNativeXLMTransferWithContractKey(from: string, to: string, amount: string, contractKeypair: any) {
    try {
      // Create a payment transaction from the contract to the destination
      // The contract will be the source of the XLM transfer
      const paymentTransaction = await this.createPaymentTransaction(contractKeypair.publicKey(), to, amount, 'XLM');
      
      logger.info('🔨 Native payment transaction created successfully');

      // Sign the transaction with the contract's keypair
      logger.info('✍️ Signing native payment transaction with contract keypair...');
      paymentTransaction.sign(contractKeypair);
      logger.info('✅ Native payment transaction signed successfully');

      // Submit the transaction
      logger.info('📤 Submitting native payment transaction...');
      const submitResult = await this.sendTransaction(paymentTransaction);
      
      logger.info('✅ Native XLM transfer submitted successfully!', {
        hash: submitResult.hash,
        from: contractKeypair.publicKey(),
        to,
        amount
      });

      return {
        success: true,
        hash: submitResult.hash,
        from: contractKeypair.publicKey(),
        to,
        amount
      };

    } catch (error: any) {
      logger.error('❌ Error in native XLM transfer with contract key:', error);
      throw new Error(`Native transfer failed: ${error.message}`);
    }
  }

  /**
   * Poll transaction status until completion
   */
  private async pollTransactionStatus(transactionHash: string, maxAttempts: number = 30): Promise<any> {
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const transaction = await this.server.getTransaction(transactionHash);
        
        if (transaction.status === 'SUCCESS') {
          return transaction;
        } else if (transaction.status === 'FAILED') {
          logger.error('❌ Transaction failed:', {
            status: transaction.status,
            resultXdr: transaction.resultXdr,
            ledger: transaction.ledger
          });
          throw new Error('Transaction failed');
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
}

export const stellarService = new StellarService();
