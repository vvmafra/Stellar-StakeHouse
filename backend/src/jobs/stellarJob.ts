import { logger } from '../utils/logger.js';
import { stellarService } from '../services/stellarService.js';

class StellarJob {
  // private contractAddress: string;

  // constructor() {
  //   // Contract ID from the main project
  //   this.contractAddress = "CDYKETT4G6VXMPRKFLSYFNGIWKN2UMQSGOCUN5BELOBZAOEQBVAPQW6T";
  //   if (!this.contractAddress) {
  //     logger.warn('⚠️ CONTRACT_ID not set in configuration');
  //   }
  // }

  /**
   * Executa transfer_from_xlm_sac do smart contract usando a private key do contrato
   */
  async runTransferFromXlmSac() {
    try {
      logger.info('🚀 Starting transfer_from_xlm_sac job...');

      // Verificar conexão com Stellar primeiro
      const connectionStatus = await stellarService.checkConnection();
      if (!connectionStatus.connected) {
        logger.error('❌ Cannot run transfer_from_xlm_sac - Stellar connection failed');
        return;
      }

      logger.info(`🌐 Connected to Stellar network (Ledger: ${connectionStatus.latestLedger})`);

      const contractAddress = "CDYKETT4G6VXMPRKFLSYFNGIWKN2UMQSGOCUN5BELOBZAOEQBVAPQW6T";
      
      // Valores predefinidos para teste
      const from = "GBZGAMPLCDROH5CGEJ2EUY52LTK5YSBUIIASRMKLH6IKOJNUHXWBL3RW"; // Endereço de origem
      const to = "GBZGAMPLCDROH5CGEJ2EUY52LTK5YSBUIIASRMKLH6IKOJNUHXWBL3RW"; // Endereço de destino
      const amount = "10000000000"; // 10 XLM em stroops

      logger.info(`📋 Using predefined values:`, {
        contractAddress,
        from,
        to,
        amount
      });

      // Executar transfer_from_xlm_sac usando a private key do contrato
      const result = await stellarService.transferFromXlmSac(
        contractAddress,
        from,
        to,
        amount
      );

      logger.info('🎉 Transfer_from_xlm_sac job completed successfully!', result);
      return result;

    } catch (error) {
      logger.error('❌ Error in transfer_from_xlm_sac job:', error);
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

      const contractAddress = "CDYKETT4G6VXMPRKFLSYFNGIWKN2UMQSGOCUN5BELOBZAOEQBVAPQW6T";

      // 1. Verificar balance do owner
      logger.info('📊 Step 1: Getting owner balance...');
      const owner = await stellarService.getOwner(contractAddress);
      logger.info(`💰 Owner balance: ${owner.balance} stroops`);

      // 2. Buscar participantes
      logger.info('👥 Step 2: Getting participants...');
      const participants = await stellarService.getParticipants(contractAddress);
      
      if (participants.length === 0) {
        logger.info('✅ No participants found, skipping distribution');
        return;
      }
      
      logger.info(`👥 Found ${participants.length} participants`);

      // 3. Verificar saldos de token nativo dos participantes
      logger.info('🔍 Step 3: Checking native token balances...');
      const participantAddresses = participants.map(p => p.address);
      
      // Filtrar apenas endereços válidos do Stellar (começam com G e têm 56 caracteres)
      const validAddresses = participantAddresses.filter(addr => 
        addr && addr.startsWith('G') && addr.length === 56
      );
      
      if (validAddresses.length === 0) {
        logger.info('✅ No valid participant addresses found, skipping distribution');
        return;
      }
      
      logger.info(`🔍 Checking balances for ${validAddresses.length} valid addresses...`);
      const validParticipants = await stellarService.getMultipleNativeTokenBalances(validAddresses);
      
      if (validParticipants.length === 0) {
        logger.info('✅ No participants with native token balance, skipping distribution');
        return;
      }
      
      logger.info(`✅ Found ${validParticipants.length} participants with native token balance`);

      // 4. Calcular APR
      logger.info('🧮 Step 4: Calculating APR...');
      const totalStakes = participants.reduce((sum, participant) => sum + parseFloat(participant.stake), 0);
      logger.info(`📊 Total stakes: ${totalStakes} stroops`);
      const aprData = await stellarService.calculateAPR(contractAddress, owner.balance, totalStakes);
      logger.info(`📈 APR: ${(aprData.rate * 100).toFixed(2)}% (Daily: ${(aprData.dailyRate * 100).toFixed(4)}%)`);

      // 5. Distribuir recompensas
      logger.info('💰 Step 5: Distributing rewards...');
      const distribution = await stellarService.distribute(contractAddress, validParticipants, aprData);
      
      logger.info(`🎉 Distribution cycle completed successfully!`);
      logger.info(`📊 Summary: ${distribution.totalDistributed} stroops distributed to ${distribution.participantsRewarded} participants`);
      
    } catch (error) {
      logger.error('❌ Error in distribution cycle:', error);
    }
  }
}

export const stellarJob = new StellarJob();
