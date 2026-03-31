import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { ORDER_STATUS_TRANSITIONS } from './order-status-transitions';
import { OrderStatus } from '../common/enums/order-status.enum';
import { OrderStatusPolicyService } from './order-status-policy.service';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly statusPolicy: OrderStatusPolicyService,
  ) {}

  async create(data: any, user: any) {
    const year = new Date().getFullYear();

    return this.prisma.$transaction(async (tx) => {
      const sequence = await tx.orderNumberSequence.upsert({
        where: { year },
        update: { lastValue: { increment: 1 } },
        create: { year, lastValue: 1 },
      });

      const orderNumber = `SC-${year}-${String(sequence.lastValue).padStart(6, '0')}`;

      const order = await tx.repairOrder.create({
        data: {
          orderNumber,
          clientId: data.clientId,
          deviceId: data.deviceId,
          receiverUserId: user.id,
          masterUserId: data.masterId ?? null,
          status: 'accepted',
          issueDescription: data.issueDescription,
          conditionAtAcceptance: data.conditionAtAcceptance,
          includedItems: data.includedItems ?? null,
          estimatedPrice: data.estimatedPrice ?? null,
          estimatedReadyAt: data.estimatedReadyAt
            ? new Date(data.estimatedReadyAt)
            : null,
          receiverComment: data.receiverComment ?? null,
        },
      });

      await tx.repairOrderStatusHistory.create({
        data: {
          orderId: order.id,
          fromStatus: null,
          toStatus: 'accepted',
          changedBy: user.id,
        },
      });

      return order;
    });
  }

  async findAll(user: any) {
    const where: any = { deletedAt: null };

    if (user.roles.includes('master')) {
      where.masterUserId = user.id;
    }

    return this.prisma.repairOrder.findMany({ where });
  }

  async changeStatus(orderId: string, dto: any, user: any) {
    const order = await this.prisma.repairOrder.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (user.roles.includes('master') && order.masterUserId !== user.id) {
      throw new ForbiddenException('Access denied');
    }

    const current = order.status as OrderStatus;
    const next = dto.toStatus as OrderStatus;

    this.statusPolicy.validateRole(user.roles, next);

    const allowed = ORDER_STATUS_TRANSITIONS[current] ?? [];
    if (!allowed.includes(next)) {
      throw new BadRequestException('Invalid transition');
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.repairOrder.update({
        where: { id: orderId },
        data: {
          status: next,
          ...(next === OrderStatus.ISSUED
            ? { issuedAt: new Date(), issuedBy: user.id }
            : {}),
        },
      });

      await tx.repairOrderStatusHistory.create({
        data: {
          orderId,
          fromStatus: current,
          toStatus: next,
          changedBy: user.id,
          comment: dto.comment ?? null,
        },
      });

      return updated;
    });
  }

  async getStatusHistory(orderId: string) {
    return this.prisma.repairOrderStatusHistory.findMany({
      where: { orderId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getFiles(orderId: string) {
    return this.prisma.file.findMany({
      where: {
        entityType: 'order',
        entityId: orderId,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}