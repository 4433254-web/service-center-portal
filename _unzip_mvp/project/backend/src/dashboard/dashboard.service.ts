import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats(user: any) {
    const masterFilter =
      user.roles.includes('master') && !user.roles.includes('admin')
        ? { masterUserId: user.id }
        : {};

    const baseWhere = { deletedAt: null, ...masterFilter };

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      total,
      accepted,
      inDiagnostics,
      waitingApproval,
      inProgress,
      ready,
      issuedToday,
      recentOrders,
    ] = await Promise.all([
      this.prisma.repairOrder.count({ where: baseWhere }),
      this.prisma.repairOrder.count({ where: { ...baseWhere, status: 'accepted' } }),
      this.prisma.repairOrder.count({ where: { ...baseWhere, status: 'in_diagnostics' } }),
      this.prisma.repairOrder.count({ where: { ...baseWhere, status: 'waiting_approval' } }),
      this.prisma.repairOrder.count({ where: { ...baseWhere, status: 'in_progress' } }),
      this.prisma.repairOrder.count({ where: { ...baseWhere, status: 'ready' } }),
      this.prisma.repairOrder.count({
        where: {
          ...baseWhere,
          status: 'issued',
          issuedAt: { gte: today, lt: tomorrow },
        },
      }),
      this.prisma.repairOrder.findMany({
        where: baseWhere,
        include: {
          client: { select: { id: true, fullName: true, phone: true } },
          device: { select: { id: true, brand: true, model: true } },
        },
        orderBy: { updatedAt: 'desc' },
        take: 10,
      }),
    ]);

    return {
      stats: {
        total,
        accepted,
        inDiagnostics,
        waitingApproval,
        inProgress,
        ready,
        issuedToday,
        activeOrders: accepted + inDiagnostics + waitingApproval + inProgress,
      },
      recentOrders,
    };
  }
}
