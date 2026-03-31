import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  getHealth() {
    return { status: 'ok' };
  }

  @Get('db')
  async getDbHealth() {
    await this.prisma.$queryRaw`SELECT 1`;
    return { status: 'db-ok' };
  }

  @Get('storage')
  getStorageHealth() {
    return { status: 'storage-ok' };
  }

  @Get('dump')
  async dump() {
    const [users, clients, devices, orders, documents, files] =
      await Promise.all([
        this.prisma.user.findMany({
          include: { roles: { include: { role: true } } },
        }),
        this.prisma.client.findMany(),
        this.prisma.device.findMany(),
        this.prisma.repairOrder.findMany(),
        this.prisma.document.findMany(),
        this.prisma.file.findMany(),
      ]);

    return {
      users,
      clients,
      devices,
      orders,
      documents,
      files,
    };
  }
}