import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { ApiResponse } from '@monorepo/shared-types';
import { formatTime } from '@monorepo/shared-utils';
import { DonorsService } from './services/DonorsService';
import donationsRouter from './routes/donations';
import statisticsRouter from './routes/statistics';
import mediaRouter from './routes/media';
import contactRouter from './routes/contact';
import authRouter from './routes/auth';
import adminRouter from './routes/admin';

const app = express();

// CORS configuration - must be before other middleware
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5175',
      'http://localhost:5176',
      'http://localhost:5177',
      'https://frontend-five-ruddy-ztsl9rllwx.vercel.app',
      process.env.FRONTEND_URL,
    ].filter(Boolean);

    // Always allow if no origin (simple requests or same-origin)
    // Or allow if origin matches
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`[CORS] Rejected origin: ${origin}. Allowed: ${allowedOrigins.join(', ')}`);
      callback(null, true); // Allow for now, log for debugging
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));

// Add explicit CORS headers for preflight and all responses
app.use((_req: Request, res: Response, next: NextFunction) => {
  // Set CORS headers explicitly
  const origin = _req.get('origin');
  res.setHeader('Access-Control-Allow-Origin', origin || '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Allow postMessage from Google OAuth
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  
  next();
});

// Handle preflight requests
app.options('*', (_req: Request, res: Response, _next: NextFunction) => {
  const origin = _req.get('origin');
  res.setHeader('Access-Control-Allow-Origin', origin || '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  res.sendStatus(200);
});

// Middleware - increase payload size limits
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response<ApiResponse<object>>) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: formatTime(new Date()),
      service: 'UH Shoham Server',
      uptime: process.uptime(),
    },
    message: 'Server is running',
  });
});

// Debug endpoint - check environment variables
app.get('/api/debug', (_req: Request, res: Response) => {
  const allKeys = Object.keys(process.env).sort();
  const filteredVars: Record<string, string> = {};
  
  allKeys.forEach((key) => {
    if (key.toLowerCase().includes('database') ||
        key.toLowerCase().includes('neon') ||
        key.toLowerCase().includes('postgres') ||
        key.toLowerCase().includes('url')) {
      filteredVars[key] = process.env[key]?.substring(0, 50) || 'SET TO EMPTY';
    }
  });

  res.json({
    all_keys: allKeys,
    filtered_vars: filteredVars,
  });
});

// Public endpoint for donors (תורמים וחסויות)
app.get('/api/donors', async (_req: Request, res: Response) => {
  try {
    const result = await DonorsService.getDonors();
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      timestamp: new Date(),
    });
  }
});

// Routes
app.use('/api/donations', donationsRouter);
app.use('/api/statistics', statisticsRouter);
app.use('/api/media', mediaRouter);
app.use('/api/contact', contactRouter);
app.use('/api/auth', authRouter);
app.use('/api/admin', adminRouter);

// Error handling middleware
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal server error',
    timestamp: new Date(),
  });
});

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: _req.path,
    timestamp: new Date(),
  });
});

export default app;
