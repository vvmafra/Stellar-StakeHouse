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
      // Por enquanto retorna um placeholder
      const participants = [
        { address: 'participant1_address', stake: '100000' },
        { address: 'participant2_address', stake: '200000' },
        { address: 'participant3_address', stake: '150000' }
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
   * Call transfer_from function on the smart contract
   * @param contractAddress - The contract address
   * @param spender - Who is executing the transfer (must be authorized)
   * @param from - Account to transfer from
   * @param to - Account to transfer to
   * @param amount - Amount in stroops
   */
  async transferFrom(contractAddress: string, spender: string, from: string, to: string, amount: string) {
    try {
      logger.info(`🚀 Starting transfer_from call:`, {
        contractAddress,
        spender,
        from,
        to,
        amount
      });

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

      // Get account details for the spender
      const account = await this.server.getAccount(spender);
      logger.info(`👤 Account details retrieved for spender: ${account.accountId()}`);

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

      // Sign the transaction with the spender's keypair
      logger.info('✍️ Signing transaction...');
      const keypair = Keypair.fromSecret(spender);
      preparedTransaction.sign(keypair);
      logger.info('✅ Transaction signed successfully');

      // Submit the signed transaction
      logger.info('📤 Submitting transaction...');
      const submitResult = await this.server.sendTransaction(preparedTransaction);
      logger.info(`✅ Transaction submitted with hash: ${submitResult.hash}`);

      // Poll for transaction completion
      logger.info('⏳ Waiting for transaction confirmation...');
      const finalResult = await this.pollTransactionStatus(submitResult.hash);

      logger.info('🎉 Transfer completed successfully!', {
        hash: submitResult.hash,
        from,
        to,
        amount,
        finalResult: finalResult
      });

      return {
        success: true,
        hash: submitResult.hash,
        from,
        to,
        amount,
        result: finalResult
      };

    } catch (error: any) {
      logger.error('❌ Error calling transfer_from:', error);
      throw new Error(`Transfer failed: ${error.message}`);
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

export const stellarService = new StellarService();
