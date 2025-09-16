import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { logger } from './utils/logger.js';
import { cronManager } from './jobs/cronManager.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? [process.env.FRONTEND_URL || 'https://your-frontend-domain.com'] 
    : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});

// API routes
app.get('/api/status', (req, res) => {
  res.json({
    message: 'Stellar Stake House Backend API',
    version: '1.0.0',
    status: 'running'
  });
});

// Stellar connection test endpoint
app.get('/api/stellar/status', async (req, res) => {
  try {
    const { stellarService } = await import('./services/stellarService.js');
    const connectionStatus = await stellarService.checkConnection();
    res.json(connectionStatus);
  } catch (error) {
    res.status(500).json({
      connected: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Cronjobs status endpoint
app.get('/api/cronjobs/status', (req, res) => {
  try {
    const { cronManager } = require('./jobs/cronManager.js');
    const status = cronManager.getJobStatus();
    res.json({
      cronjobs: status,
      enabled: process.env.CRON_ENABLED === 'true'
    });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Transfer from endpoint for testing
app.post('/api/transfer-from', async (req, res) => {
  try {
    const { spender, from, to, amount } = req.body;
    
    if (!spender || !from || !to || !amount) {
      return res.status(400).json({ 
        error: 'Missing required parameters: spender, from, to, amount' 
      });
    }

    const { stellarJob } = await import('./jobs/stellarJob.js');
    
    const result = await stellarJob.runTransferFrom(spender, from, to, amount);
    
    res.json({
      message: 'Transfer_from executed successfully',
      result
    });
  } catch (error: any) {
    logger.error('Error in transfer_from endpoint:', error);
    res.status(500).json({ 
      error: 'Transfer_from failed', 
      details: error.message 
    });
  }
});

// Error handling middleware
import type { Request, Response, NextFunction } from 'express';

app.use((req: Request, res: Response, next: NextFunction) => {
  const { notFoundHandler } = require('./middleware/notFoundHandler.js');
  notFoundHandler(req, res, next);
});

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  const { errorHandler } = require('./middleware/errorHandler.js');
  errorHandler(err, req, res, next);
});

// Start server
const server = app.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT}`);
  logger.info(`📊 Health check: http://localhost:${PORT}/health`);
  logger.info(`🌐 API status: http://localhost:${PORT}/api/status`);
});

// Initialize cronjobs
if (process.env.CRON_ENABLED === 'true') {
  cronManager.start();
  logger.info('⏰ Cronjobs initialized');
}

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  cronManager.stop();
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  cronManager.stop();
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

export default app;
