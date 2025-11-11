import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getHello(): object {
    return {
      message: 'Bill Management System API',
      status: 'running',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('health')
  healthCheck(): object {
    return {
      status: 'ok',
      database: 'connected',
      redis: 'connected',
    };
  }
}
