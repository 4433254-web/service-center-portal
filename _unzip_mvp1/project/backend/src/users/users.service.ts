import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import * as bcrypt from 'bcrypt';

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
      include: { roles: { include: { role: true } } },
    });
  }

  async findAll() {
    const users = await this.prisma.user.findMany({
      include: { roles: { include: { role: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return users.map((u) => ({
      ...u,
      passwordHash: undefined,
      roles: u.roles.map((r) => r.role.name),
    }));
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { roles: { include: { role: true } } },
    });
    if (!user) throw new NotFoundException('User not found');
    return { ...user, passwordHash: undefined, roles: user.roles.map((r) => r.role.name) };
  }

  async update(id: string, data: { isActive?: boolean; roles?: string[] }) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    if (data.roles !== undefined) {
      await this.prisma.userRole.deleteMany({ where: { userId: id } });
      if (data.roles.length > 0) {
        const roleRecords = await this.prisma.role.findMany({
          where: { name: { in: data.roles as any[] } },
        });
        await this.prisma.userRole.createMany({
          data: roleRecords.map((r) => ({ userId: id, roleId: r.id })),
        });
      }
    }

    return this.prisma.user.update({
      where: { id },
      data: { isActive: data.isActive },
      include: { roles: { include: { role: true } } },
    });
  }

  async resetPassword(id: string, password: string) {
    const hash = await bcrypt.hash(password, 10);
    return this.prisma.user.update({
      where: { id },
      data: { passwordHash: hash },
      select: { id: true, login: true, isActive: true },
    });
  }
}
