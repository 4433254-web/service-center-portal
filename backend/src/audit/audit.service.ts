import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(data: {
    userId: string;
    entityType: string;
    entityId: string;
    actionType: string;
    oldValue?: any;
    newValue?: any;
  }) {
    return this.prisma.auditLog.create({ data });
  }

  async findAll(query?: any) {
    const page = Number(query?.page ?? 1);
    const limit = Number(query?.limit ?? 50);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query?.entityType) where.entityType = query.entityType;
    if (query?.entityId) where.entityId = query.entityId;
    if (query?.userId) where.userId = query.userId;

    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        include: {
          user: { select: { id: true, login: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { items, total, page, limit };
  }
}
