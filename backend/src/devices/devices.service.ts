import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class DevicesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: any, user: any) {
    return this.prisma.device.create({
      data: {
        clientId: data.clientId,
        deviceType: data.deviceType,
        brand: data.brand,
        model: data.model,
        modification: data.modification ?? null,
        color: data.color ?? null,
        imei: data.imei ?? null,
        serialNumber: data.serialNumber ?? null,
        conditionDescription: data.conditionDescription ?? null,
        includedItems: data.includedItems ?? null,
        accessCode: data.accessCode ?? null,
        comment: data.comment ?? null,
        createdBy: '986c2998-21d2-40ef-a270-a590264b3e71',
      },
    });
  }

  async findAll(search?: string, user?: any) {
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

  async update(id: string, data: any, user: any) {
    return this.prisma.device.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    return this.prisma.device.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}