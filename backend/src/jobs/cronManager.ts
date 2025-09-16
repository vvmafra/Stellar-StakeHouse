import cron from 'node-cron';
import { logger } from '../utils/logger.js';
import { stellarJob } from './stellarJob.js';

class CronManager {
  private jobs: Map<string, cron.ScheduledTask> = new Map();

  start() {
    try {

        // Job para transfer_from_xlm_sac (executa a cada 24 horas)
        const transferJob = cron.schedule('0 0 * * *', async () => {
          logger.info('🔄 Running transfer_from_xlm_sac job');
          await stellarJob.runTransferFromXlmSac();
      }, {
        scheduled: false,
        timezone: process.env.CRON_TIMEZONE || 'America/Sao_Paulo'
      });

      
      // Job principal para distribuição de recompensas (executa a cada 5 minutos)
      const distributionJob = cron.schedule('*/5 * * * *', async () => {
        logger.info('🔄 Running distribution job');
        await stellarJob.runDistributionCycle();
      }, {
        scheduled: false,
        timezone: process.env.CRON_TIMEZONE || 'America/Sao_Paulo'
      });

      

      // Armazenar referências dos jobs
      this.jobs.set('transfer_xlm_sac', transferJob);
      this.jobs.set('distribution', distributionJob);
      

      // Iniciar o job
      this.jobs.forEach((job, name) => {
        job.start();
        logger.info(`✅ Started cronjob: ${name}`);
      });

      logger.info('🎯 All cronjobs started successfully');
    } catch (error) {
      logger.error('❌ Error starting cronjobs:', error);
      throw error;
    }
  }

  stop() {
    try {
      this.jobs.forEach((job, name) => {
        job.stop();
        logger.info(`🛑 Stopped cronjob: ${name}`);
      });
      this.jobs.clear();
      logger.info('🎯 All cronjobs stopped');
    } catch (error) {
      logger.error('❌ Error stopping cronjobs:', error);
    }
  }

  getJobStatus() {
    const status: Record<string, boolean> = {};
    this.jobs.forEach((job, name) => {
      // Verifica se o job está ativo baseado na propriedade running
      status[name] = (job as any).running || false;
    });
    return status;
  }

  restartJob(jobName: string) {
    const job = this.jobs.get(jobName);
    if (job) {
      job.stop();
      job.start();
      logger.info(`🔄 Restarted cronjob: ${jobName}`);
    } else {
      logger.warn(`⚠️ Job not found: ${jobName}`);
    }
  }
}

export const cronManager = new CronManager();
