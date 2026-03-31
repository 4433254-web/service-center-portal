import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class ClientsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: any, user: any) {
    return this.prisma.client.create({
      data: {
        clientType: data.clientType ?? 'individual',
        fullName: data.fullName,
        phone: data.phone,
        phoneExtra: data.phoneExtra ?? null,
        email: data.email ?? null,
        comment: data.comment ?? null,
        createdBy: user.id,
      },
    });
  }

  async findAll(search: string, user: any) {
    const where: any = { deletedAt: null };

    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (user.roles.includes('master')) {
      where.orders = {
        some: {
          masterUserId: user.id,
          deletedAt: null,
        },
      };
    }

    return this.prisma.client.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const client = await this.prisma.client.findFirst({
      where: { id, deletedAt: null },
    });

    if (!client) throw new NotFoundException('Client not found');

    return client;
  }

  async findOrders(id: string) {
    return this.prisma.repairOrder.findMany({
      where: { clientId: id, deletedAt: null },
      include: {
        device: {
          select: { id: true, brand: true, model: true, deviceType: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findDevices(id: string) {
    return this.prisma.device.findMany({
      where: { clientId: id, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(id: string, data: any, user: any) {
    const existing = await this.prisma.client.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) throw new NotFoundException('Client not found');

    return this.prisma.client.update({
      where: { id },
      data: { ...data, updatedBy: user.id },
    });
  }

  async remove(id: string) {
    return this.prisma.client.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
