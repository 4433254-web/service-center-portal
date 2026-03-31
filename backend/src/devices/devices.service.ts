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
    });
  }

  async findAll(search?: string, user?: any) {
    const where: any = { deletedAt: null };

    if (search) {
      where.OR = [
        { brand: { contains: search, mode: 'insensitive' } },
        { model: { contains: search, mode: 'insensitive' } },
        { serialNumber: { contains: search } },
        { imei: { contains: search } },
      ];
    }

    if (user?.roles?.includes('master')) {
      where.orders = {
        some: {
          masterUserId: user.id,
          deletedAt: null,
        },
      };
    }

    return this.prisma.device.findMany({
      where,
      include: {
        client: {
          select: { id: true, fullName: true, phone: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, user: any) {
    const device = await this.prisma.device.findFirst({
      where: { id, deletedAt: null },
      include: {
        client: {
          select: { id: true, fullName: true, phone: true },
        },
      },
    });

    if (!device) throw new NotFoundException('Device not found');

    // Hide access_code from manager
    if (user?.roles?.includes('manager')) {
      return { ...device, accessCode: undefined };
    }

    return device;
  }

  async findOrders(id: string) {
    return this.prisma.repairOrder.findMany({
      where: { deviceId: id, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(id: string, data: any, user: any) {
    const existing = await this.prisma.device.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) throw new NotFoundException('Device not found');

    // Don't allow updating access_code through this endpoint for unauthorized roles
    const { accessCode, ...safeData } = data;
    const updateData = user?.roles?.includes('admin') || user?.roles?.includes('receiver')
      ? data
      : safeData;

    return this.prisma.device.update({
      where: { id },
      data: { ...updateData, updatedBy: user.id },
    });
  }

  async remove(id: string) {
    return this.prisma.device.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
