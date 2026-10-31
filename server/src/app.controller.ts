import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  root() {
    return {
      status: 'ok',
      service: 'Verbex AI Unified Backend API',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('health')
  health() {
    return { status: 'healthy' };
  }
}
