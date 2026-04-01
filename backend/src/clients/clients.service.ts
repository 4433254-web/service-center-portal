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

  async findAll(query: any, user: any) {
    const where: any = { deletedAt: null };

    if (query?.search) {
      where.OR = [
        { fullName: { contains: query.search, mode: 'insensitive' } },
        { phone: { contains: query.search } },
        { email: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (user.roles.includes('master')) {
      where.orders = {
        some: { masterUserId: user.id, deletedAt: null },
      };
    }

    const page = Number(query?.page ?? 1);
    const limit = Number(query?.limit ?? 20);
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.client.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.client.count({ where }),
    ]);

    return { items, total, page, limit };
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
