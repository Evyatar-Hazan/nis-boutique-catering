import { VercelRequest, VercelResponse } from '@vercel/node';

let app: any = null;
let initError: Error | null = null;

const getApp = () => {
  if (!app) {
    try {
      app = require('../src/app').default;
    } catch (error) {
      initError = error instanceof Error ? error : new Error(String(error));
      throw error;
    }
  }
  return app;
};

export default async (req: VercelRequest, res: VercelResponse) => {
  try {
    console.log('[HANDLER] Request to:', req.url);
    console.log('[HANDLER] DATABASE_URL set:', !!process.env.DATABASE_URL);
    console.log('[HANDLER] DATABASE_URL starts with:', process.env.DATABASE_URL?.substring(0, 25));
    
    const app = getApp();
    return app(req, res);
  } catch (error) {
    console.error('[HANDLER] Error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: initError ? initError.message : 'No init error',
    });
  }
};
