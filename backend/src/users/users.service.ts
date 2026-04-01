import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import * as bcrypt from 'bcrypt';

function normalizeUser(user: any) {
  return {
    ...user,
    roles: (user.roles ?? []).map((r: any) =>
      typeof r === 'string' ? r : r.role?.name ?? r.name,
    ),
  };
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    login: string;
    password: string;
    roles?: string[];
    isActive?: boolean;
  }) {
    const hash = await bcrypt.hash(data.password, 10);

    const roleRecords = data.roles?.length
      ? await this.prisma.role.findMany({
          where: { name: { in: data.roles as any[] } },
        })
      : [];

    return this.prisma.user.create({
      data: {
        login: data.login,
        passwordHash: hash,
        isActive: data.isActive ?? true,
        roles: roleRecords.length
          ? { create: roleRecords.map((role) => ({ roleId: role.id })) }
          : undefined,
      },
      include: {
        roles: { include: { role: true } },
      },
    });
  }

  async findAll() {
    const users = await this.prisma.user.findMany({
      include: { roles: { include: { role: true } } },
      orderBy: { createdAt: 'asc' },
    });
    return users.map(normalizeUser);
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { roles: { include: { role: true } } },
    });
    if (!user) throw new NotFoundException('User not found');
    return normalizeUser(user);
  }

  async update(id: string, data: {
    isActive?: boolean;
    roles?: string[];
  }) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    if (data.roles !== undefined) {
      const roleRecords = await this.prisma.role.findMany({
        where: { name: { in: data.roles as any[] } },
      });

      // Replace all roles
      await this.prisma.userRole.deleteMany({ where: { userId: id } });

      if (roleRecords.length) {
        await this.prisma.userRole.createMany({
          data: roleRecords.map((role) => ({ userId: id, roleId: role.id })),
        });
      }
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
      },
      include: { roles: { include: { role: true } } },
    });

    return normalizeUser(updated);
  }

  async resetPassword(id: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    const hash = await bcrypt.hash(newPassword, 10);

    return this.prisma.user.update({
      where: { id },
      data: { passwordHash: hash },
      select: { id: true, login: true },
    });
  }
}
