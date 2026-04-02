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

  async findAll(query: any) {
    const page = parseInt(query.page ?? '1');
    const limit = parseInt(query.limit ?? '30');
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: { user: { select: { id: true, login: true } } },
      }),
      this.prisma.auditLog.count(),
    ]);

    return { items, total, page, limit };
  }
}
