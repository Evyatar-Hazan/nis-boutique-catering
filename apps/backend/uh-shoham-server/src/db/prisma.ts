import { PrismaClient } from '@prisma/client';

// If DATABASE_URL is not valid in Vercel, use hardcoded value from build time
const getDatabaseUrl = (): string => {
  let url = process.env.DATABASE_URL;
  
  // Check if it's invalid (looks like a JWT or empty)
  if (!url || !url.startsWith('postgresql://') && !url.startsWith('postgres://')) {
    // Fallback to hardcoded URL (this gets filled at build time)
    url = "postgresql://neondb_owner:npg_uSKJlM73OxLt@ep-soft-voice-aiaw0ein-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
    console.log('[Prisma] Using hardcoded DATABASE_URL because env var is invalid');
  } else {
    console.log('[Prisma] Using DATABASE_URL from environment');
  }
  
  return url;
};

let prismaInstance: PrismaClient | null = null;

export const getPrismaClient = (): PrismaClient => {
  if (!prismaInstance) {
    const url = getDatabaseUrl();
    
    if (!url.startsWith('postgresql://') && !url.startsWith('postgres://')) {
      throw new Error(`[Prisma] Invalid DATABASE_URL: ${url.substring(0, 50)}`);
    }
    
    // Override process.env.DATABASE_URL for Prisma
    process.env.DATABASE_URL = url;
    
    prismaInstance = new PrismaClient({
      log: ['error', 'warn'],
    });
    console.log('[Prisma] ✅ Client initialized');
  }
  
  return prismaInstance;
};

// Initialize immediately
const prisma = getPrismaClient();
export default prisma;
