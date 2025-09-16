import { logger } from '../utils/logger.js';
import { stellarService } from '../services/stellarService.js';

class StellarJob {
  private contractAddress: string;

  constructor() {
    this.contractAddress = process.env.CONTRACT_ADDRESS || '';
    if (!this.contractAddress) {
      logger.warn('⚠️ CONTRACT_ADDRESS not set in environment variables');
    }
  }

  /**
   * Executa transfer_from do smart contract
   * @param spender - Quem está executando a transferência
   * @param from - Conta de origem
   * @param to - Conta de destino
   * @param amount - Quantidade em stroops
   */
  async runTransferFrom(spender: string, from: string, to: string, amount: string) {
    try {
      logger.info('🚀 Starting transfer_from job...', {
        contractAddress: this.contractAddress,
        spender,
        from,
        to,
        amount
      });

      if (!this.contractAddress) {
        logger.error('❌ Contract address not configured');
        return;
      }

      // Verificar conexão com Stellar primeiro
      const connectionStatus = await stellarService.checkConnection();
      if (!connectionStatus.connected) {
        logger.error('❌ Cannot run transfer_from - Stellar connection failed');
        return;
      }

      logger.info(`🌐 Connected to Stellar network (Ledger: ${connectionStatus.latestLedger})`);

      // Executar transfer_from
      const result = await stellarService.transferFrom(
        this.contractAddress,
        spender,
        from,
        to,
        amount
      );

      logger.info('🎉 Transfer_from job completed successfully!', result);
      return result;

    } catch (error) {
      logger.error('❌ Error in transfer_from job:', error);
      throw error;
    }
  }

  /**
   * Ciclo principal de distribuição que roda a cada 10 minutos
   */
  async runDistributionCycle() {
    try {
      logger.info('🚀 Starting distribution cycle...');
      
      // Verificar conexão com Stellar primeiro
      const connectionStatus = await stellarService.checkConnection();
      if (!connectionStatus.connected) {
        logger.error('❌ Cannot run distribution cycle - Stellar connection failed');
        return;
      }
      
      logger.info(`🌐 Connected to Stellar network (Ledger: ${connectionStatus.latestLedger})`);

      if (!this.contractAddress) {
        logger.error('❌ Contract address not configured');
        return;
      }

      // 1. Verificar balance do owner
      logger.info('📊 Step 1: Getting owner balance...');
      const owner = await stellarService.getOwner(this.contractAddress);
      logger.info(`💰 Owner balance: ${owner.balance} stroops`);

      // 2. Buscar participantes
      logger.info('👥 Step 2: Getting participants...');
      const participants = await stellarService.getParticipants(this.contractAddress);
      
      if (participants.length === 0) {
        logger.info('✅ No participants found, skipping distribution');
        return;
      }
      
      logger.info(`👥 Found ${participants.length} participants`);

      // 3. Verificar saldos de token nativo dos participantes
      logger.info('🔍 Step 3: Checking native token balances...');
      const participantAddresses = participants.map(p => p.address);
      const validParticipants = await stellarService.getMultipleNativeTokenBalances(participantAddresses);
      
      if (validParticipants.length === 0) {
        logger.info('✅ No participants with native token balance, skipping distribution');
        return;
      }
      
      logger.info(`✅ Found ${validParticipants.length} participants with native token balance`);

      // 4. Calcular APR
      logger.info('🧮 Step 4: Calculating APR...');
      const totalStakes = participants.reduce((sum, participant) => sum + parseFloat(participant.stake), 0);
      logger.info(`📊 Total stakes: ${totalStakes} stroops`);
      const aprData = await stellarService.calculateAPR(this.contractAddress, owner.balance, totalStakes);
      logger.info(`📈 APR: ${(aprData.rate * 100).toFixed(2)}% (Daily: ${(aprData.dailyRate * 100).toFixed(4)}%)`);

      // 5. Distribuir recompensas
      logger.info('💰 Step 5: Distributing rewards...');
      const distribution = await stellarService.distribute(this.contractAddress, validParticipants, aprData);
      
      logger.info(`🎉 Distribution cycle completed successfully!`);
      logger.info(`📊 Summary: ${distribution.totalDistributed} stroops distributed to ${distribution.participantsRewarded} participants`);
      
    } catch (error) {
      logger.error('❌ Error in distribution cycle:', error);
    }
  }
}

export const stellarJob = new StellarJob();
