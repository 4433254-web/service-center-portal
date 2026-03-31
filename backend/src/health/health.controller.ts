import { Controller, Get } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';

@Controller('health')
@Public()
export class HealthController {
  @Get()
  health() {
    return { status: 'ok', timestamp: new Date().toISOString() };
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
