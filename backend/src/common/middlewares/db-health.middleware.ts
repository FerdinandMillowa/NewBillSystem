import { Injectable, NestMiddleware } from '@nestjs/common';
import { InjectConnection } from '@nestjs/typeorm';
import { Connection } from 'typeorm';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class DbHealthMiddleware implements NestMiddleware {
  constructor(@InjectConnection() private connection: Connection) {}

  async use(req: Request, res: Response, next: NextFunction) {
    try {
      // Check if connection is still alive
      if (!this.connection.isConnected) {
        console.warn('Database connection lost, attempting to reconnect...');
        await this.connection.connect();
      }
    } catch (error) {
      console.error('Database health check failed:', error.message);
    }
    next();
  }
}
