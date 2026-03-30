import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  health() {
    return { status: 'ok' };
  }

  @Get('db')
  db() {
    return { status: 'ok' };
  }

  @Get('storage')
  storage() {
    return { status: 'ok' };
  }
}
