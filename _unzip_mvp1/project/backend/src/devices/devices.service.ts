import { Injectable, NotFoundException } from '@nestjs/common';
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
        createdBy: user.id,
      },
      include: { client: true },
    });
  }

  async findAll(query: any, user: any) {
    const where: any = { deletedAt: null };

    if (query.search) {
      where.OR = [
        { brand: { contains: query.search, mode: 'insensitive' } },
        { model: { contains: query.search, mode: 'insensitive' } },
        { serialNumber: { contains: query.search } },
        { imei: { contains: query.search } },
      ];
    }

    if (query.clientId) {
      where.clientId = query.clientId;
    }

    const page = parseInt(query.page ?? '1');
    const limit = parseInt(query.limit ?? '20');
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.device.findMany({
        where,
        include: { client: { select: { id: true, fullName: true, phone: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.device.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async findOne(id: string, user: any) {
    const device = await this.prisma.device.findFirst({
      where: { id, deletedAt: null },
      include: { client: true },
    });

    if (!device) throw new NotFoundException('Device not found');

    // Hide accessCode from manager
    if (user.roles.includes('manager') && !user.roles.includes('admin')) {
      return { ...device, accessCode: undefined };
    }

    return device;
  }

  async update(id: string, data: any, user: any) {
    return this.prisma.device.update({
      where: { id },
      data: {
        brand: data.brand,
        model: data.model,
        modification: data.modification,
        color: data.color,
        imei: data.imei,
        serialNumber: data.serialNumber,
        conditionDescription: data.conditionDescription,
        includedItems: data.includedItems,
        accessCode: data.accessCode,
        comment: data.comment,
        updatedBy: user.id,
      },
    });
  }

  async remove(id: string) {
    return this.prisma.device.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async getOrders(deviceId: string) {
    return this.prisma.repairOrder.findMany({
      where: { deviceId, deletedAt: null },
      include: { client: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}
