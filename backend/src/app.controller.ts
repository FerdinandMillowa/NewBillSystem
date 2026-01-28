import { Controller, Get } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Controller()
export class AppController {
  constructor(
    @InjectDataSource()
    private dataSource: DataSource,
  ) {}

  @Get()
  getHello(): string {
    return 'Bill Management System API is running!';
  }

  @Get('health')
  async getHealth() {
    try {
      // Check database connection
      const isConnected = this.dataSource.isInitialized;

      // Try a simple query
      await this.dataSource.query('SELECT 1');

      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        database: {
          connected: isConnected,
          driver: this.dataSource.driver.options.type,
        },
      };
    } catch (error) {
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        database: {
          connected: false,
          error: error.message,
        },
      };
    }
  }

  @Get('health/db')
  async getDatabaseHealth() {
    try {
      const result = await this.dataSource.query(
        'SELECT version(), NOW() as current_time',
      );
      const poolSize =
        this.dataSource.driver['master']?.pool?._count || 'unknown';
      const availableConnections =
        this.dataSource.driver['master']?.pool?._idle?.length || 'unknown';

      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        database: {
          connected: true,
          version: result[0].version,
          serverTime: result[0].current_time,
          pool: {
            size: poolSize,
            available: availableConnections,
          },
        },
      };
    } catch (error) {
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        database: {
          connected: false,
          error: error.message,
        },
      };
    }
  }
}
