import { VercelRequest, VercelResponse } from '@vercel/node';

export default async (_req: VercelRequest, res: VercelResponse) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(200).json({ status: '✅ Server is running', database: 'Connected to Neon' });
};
