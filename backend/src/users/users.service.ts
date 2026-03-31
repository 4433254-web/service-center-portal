import { Injectable } from '@nestjs/common';
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
          where: {
            name: {
              in: data.roles as any[],
            },
          },
        })
      : [];

    return this.prisma.user.create({
      data: {
        login: data.login,
        passwordHash: hash,
        isActive: data.isActive ?? true,
        roles: roleRecords.length
          ? {
              create: roleRecords.map((role) => ({
                roleId: role.id,
              })),
            }
          : undefined,
      },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });
  }

  async findAll() {
    return this.prisma.user.findMany({
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });
  }
}