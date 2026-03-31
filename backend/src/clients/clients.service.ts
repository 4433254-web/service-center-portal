import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class ClientsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: any, user: any) {
    return this.prisma.client.create({
      data: {
        clientType: 'individual',
        fullName: data.fullName,
        phone: data.phone,
        email: data.email ?? null,
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
      where.repairOrders = {
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

  async update(id: string, data: any, user: any) {
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
