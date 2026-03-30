import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class DevicesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: any) {
    return this.prisma.device.create({ data });
  }

  async findAll(search?: string) {
    return this.prisma.device.findMany({
      where: {
        deletedAt: null,
        ...(search
          ? {
              OR: [
                { brand: { contains: search, mode: 'insensitive' } },
                { model: { contains: search, mode: 'insensitive' } },
                { serialNumber: { contains: search } },
                { imei: { contains: search } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(id: string, data: any) {
    return this.prisma.device.update({ where: { id }, data });
  }

  async remove(id: string) {
    return this.prisma.device.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
