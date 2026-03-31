import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats(user: any) {
    const masterFilter = user.roles.includes('master')
      ? { masterUserId: user.id }
      : {};

    const baseWhere = { deletedAt: null, ...masterFilter };

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [
      totalNew,
      totalAccepted,
      totalInDiagnostics,
      totalWaitingApproval,
      totalInProgress,
      totalReady,
      issuedToday,
      recentOrders,
    ] = await Promise.all([
      this.prisma.repairOrder.count({ where: { ...baseWhere, status: 'new' } }),
      this.prisma.repairOrder.count({ where: { ...baseWhere, status: 'accepted' } }),
      this.prisma.repairOrder.count({ where: { ...baseWhere, status: 'in_diagnostics' } }),
      this.prisma.repairOrder.count({ where: { ...baseWhere, status: 'waiting_approval' } }),
      this.prisma.repairOrder.count({ where: { ...baseWhere, status: 'in_progress' } }),
      this.prisma.repairOrder.count({ where: { ...baseWhere, status: 'ready' } }),
      this.prisma.repairOrder.count({
        where: {
          ...baseWhere,
          status: 'issued',
          issuedAt: { gte: todayStart },
        },
      }),
      this.prisma.repairOrder.findMany({
        where: baseWhere,
        orderBy: { updatedAt: 'desc' },
        take: 10,
        include: {
          client: { select: { id: true, fullName: true, phone: true } },
          device: { select: { id: true, brand: true, model: true } },
        },
      }),
    ]);

    return {
      stats: {
        new: totalNew,
        accepted: totalAccepted,
        in_diagnostics: totalInDiagnostics,
        waiting_approval: totalWaitingApproval,
        in_progress: totalInProgress,
        ready: totalReady,
        issued_today: issuedToday,
        active: totalAccepted + totalInDiagnostics + totalWaitingApproval + totalInProgress,
      },
      recent_orders: recentOrders,
    };
  }
}
