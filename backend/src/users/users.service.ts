import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    login: string;
    password: string;
    roles?: string[] | string;
    isActive?: boolean;
  }) {
    const hash = await bcrypt.hash(data.password, 10);

    const normalizedRoles = this.normalizeRoles(data.roles);

    const roleRecords = normalizedRoles.length
      ? await this.prisma.role.findMany({
          where: {
            name: {
              in: normalizedRoles as any[],
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

  private normalizeRoles(input?: string[] | string): string[] {
    if (!input) {
      return [];
    }

    if (Array.isArray(input)) {
      return input.filter(Boolean);
    }

    if (typeof input === 'string') {
      if (input === 'System.Object[]') {
        throw new BadRequestException(
          'roles must be sent as JSON array, for example ["master"]',
        );
      }

      return [input];
    }

    return [];
  }
}