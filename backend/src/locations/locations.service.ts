import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class LocationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: any, user: any) {
    return this.prisma.serviceLocation.create({
      data: {
        name: data.name,
        address: data.address ?? null,
        phone: data.phone ?? null,
        email: data.email ?? null,
        isActive: data.isActive ?? true,
        createdBy: user.id,
      },
    });
  }

  async findAll(user: any) {
    const where: any = {};
    if (user.roles.includes('manager') && !user.roles.includes('admin')) {
      where.users = { some: { userId: user.id } };
    }
    return this.prisma.serviceLocation.findMany({
      where,
      include: {
        users: {
          include: {
            user: { select: { id: true, login: true, roles: { include: { role: true } } } },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(id: string) {
    const loc = await this.prisma.serviceLocation.findUnique({
      where: { id },
      include: {
        users: {
          include: {
            user: { select: { id: true, login: true, roles: { include: { role: true } } } },
          },
        },
      },
    });
    if (!loc) throw new NotFoundException('Location not found');
    return loc;
  }

  async update(id: string, data: any) {
    return this.prisma.serviceLocation.update({ where: { id }, data });
  }

  async addUser(locationId: string, userId: string) {
    return this.prisma.userLocation.upsert({
      where: { userId_locationId: { userId, locationId } },
      update: {},
      create: { userId, locationId },
    });
  }

  async removeUser(locationId: string, userId: string) {
    return this.prisma.userLocation.deleteMany({ where: { userId, locationId } });
  }

  async getUsersByLocation(locationId: string) {
    const rows = await this.prisma.userLocation.findMany({
      where: { locationId },
      include: { user: { include: { roles: { include: { role: true } } } } },
    });
    return rows.map(r => ({
      ...r.user,
      roles: r.user.roles.map((ur: any) => ur.role.name),
    }));
  }
}
