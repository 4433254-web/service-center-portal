import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
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

  async create(data: any) {
    const year = new Date().getFullYear();

    const created = await this.prisma.$transaction(async (tx) => {
      const sequence = await tx.orderNumberSequence.upsert({
        where: { year },
        update: {
          lastValue: {
            increment: 1,
          },
        },
        create: {
          year,
          lastValue: 1,
        },
      });

      const orderNumber = `SC-${year}-${String(sequence.lastValue).padStart(6, '0')}`;

      const order = await tx.repairOrder.create({
        data: {
          orderNumber,
          clientId: data.clientId,
          deviceId: data.deviceId,
          receiverUserId: '986c2998-21d2-40ef-a270-a590264b3e71',
          masterUserId: data.masterId ?? null,
          status: 'accepted',
          issueDescription: data.issueDescription,
          conditionAtAcceptance: data.conditionAtAcceptance,
          includedItems: data.includedItems ?? null,
          estimatedPrice: data.estimatedPrice ?? null,
          estimatedReadyAt: data.estimatedReadyAt ? new Date(data.estimatedReadyAt) : null,
          receiverComment: data.receiverComment ?? null,
        },
        include: {
          client: true,
          device: true,
        },
      });

      await tx.repairOrderStatusHistory.create({
        data: {
          orderId: order.id,
          fromStatus: null,
          toStatus: 'accepted',
          changedBy: '986c2998-21d2-40ef-a270-a590264b3e71',
          comment: 'Order created',
        },
      });

      return order;
    });

    return created;
  }

  async findAll() {
    return this.prisma.repairOrder.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
      include: {
        client: true,
        device: true,
        masterUser: true,
        receiverUser: true,
        statusHistory: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  async changeStatus(
    orderId: string,
    dto: { toStatus: string; comment?: string },
    actor: { userId: string; roles: string[] },
  ) {
    const order = await this.prisma.repairOrder.findUnique({
      where: { id: orderId },
    });

    if (!order || order.deletedAt) {
      throw new NotFoundException('Order not found');
    }

    const currentStatus = order.status as OrderStatus;
    const nextStatus = dto.toStatus as OrderStatus;

    this.statusPolicy.validateRole(actor.roles, nextStatus);

    const allowedTransitions = ORDER_STATUS_TRANSITIONS[currentStatus] ?? [];
    if (!allowedTransitions.includes(nextStatus)) {
      throw new BadRequestException(
        `Transition ${currentStatus} -> ${nextStatus} is not allowed`,
      );
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const updatedOrder = await tx.repairOrder.update({
        where: { id: orderId },
        data: {
          status: nextStatus,
          ...(nextStatus === OrderStatus.ISSUED
            ? {
                issuedAt: new Date(),
                issuedBy: actor.userId,
              }
            : {}),
        },
        include: {
          client: true,
          device: true,
          masterUser: true,
          receiverUser: true,
        },
      });

      await tx.repairOrderStatusHistory.create({
        data: {
          orderId,
          fromStatus: currentStatus,
          toStatus: nextStatus,
          changedBy: actor.userId,
          comment: dto.comment ?? null,
        },
      });

      return updatedOrder;
    });

    return updated;
  }

  async getStatusHistory(orderId: string) {
    return this.prisma.repairOrderStatusHistory.findMany({
      where: { orderId },
      orderBy: { createdAt: 'asc' },
    });
  }
}