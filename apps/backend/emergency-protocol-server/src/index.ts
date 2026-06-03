import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import 'dotenv/config';
import { ApiResponse } from '@monorepo/shared-types';
import { formatTime } from '@monorepo/shared-utils';
import { config } from './config';
import authRoutes from './routes/authRoutes';
import commentRoutes from './routes/commentRoutes';

const app: Express = express();

// Middleware
app.use(helmet());
app.use(cors(config.cors));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/comments', commentRoutes);

// Health check
app.get('/health', (_req: Request, res: Response<ApiResponse<object>>) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: formatTime(new Date()),
      service: 'Emergency Protocol Server',
    },
    message: 'Server is running',
  });
});

// Error handling middleware
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    message: 'Internal server error',
    ...(config.nodeEnv === 'development' && { error: err.message }),
  });
});

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ message: 'Route not found' });
});

// Start server
if (require.main === module) {
  const { config } = require('./config');
  app.listen(config.port, () => {
    console.log(`Server running on port ${config.port}`);
  });
}

export default app;
