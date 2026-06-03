import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { ApiResponse } from '@monorepo/shared-types';
import { formatTime } from '@monorepo/shared-utils';

interface HealthStatus extends ApiResponse<{
  service: string;
  version: string;
  environment: string;
  database: {
    status: 'connected' | 'disconnected';
  };
  timestamp: string;
}> {}

@Injectable()
export class AppService {
  constructor(private prisma: PrismaService) {}

  getHello(): string {
    return 'Lev Hedva API is running!';
  }

  async getHealth(): Promise<HealthStatus> {
    const dbHealthy = await this.prisma.isHealthy();
    const now = new Date();
    
    return {
      success: dbHealthy,
      data: {
        status: dbHealthy ? 'healthy' : 'unhealthy',
        timestamp: formatTime(now),
        service: 'Lev Hedva API',
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        database: {
          status: dbHealthy ? 'connected' : 'disconnected',
        },
      },
      message: dbHealthy ? 'Service is healthy' : 'Service health check failed',
    };
  }
}
