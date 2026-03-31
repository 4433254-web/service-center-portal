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
import * as path from 'path';

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

    return this.prisma.repairOrder.findMany({
      where,
      include: {
        masterUser: { select: { id: true, login: true } },
        receiverUser: { select: { id: true, login: true } },
      },
    });
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

  async getDocuments(orderId: string, user: any) {
    const order = await this.prisma.repairOrder.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (user.roles.includes('master') && order.masterUserId !== user.id) {
      throw new ForbiddenException('Access denied');
    }

    const documents = await this.prisma.document.findMany({
      where: { orderId },
      orderBy: { createdAt: 'desc' },
    });

    return documents.map((document) => ({
      id: document.id,
      orderId: document.orderId,
      documentType: document.documentType,
      storageBucket: document.storageBucket,
      fileName: path.basename(document.storageKey),
      generatedBy: document.generatedBy,
      createdAt: document.createdAt,
    }));
  }

  /**
   * Assign a master to an order.
   * Validates that the master exists and has the 'master' role.
   * Only users with admin or manager roles should call this.
   */
  async assignMaster(orderId: string, masterUserId: string, user: any) {
    const order = await this.prisma.repairOrder.findUnique({
      where: { id: orderId },
    });
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    // Load the user to be assigned as master along with their roles
    const master = await this.prisma.user.findUnique({
      where: { id: masterUserId },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });
    if (!master) {
      throw new NotFoundException('Master not found');
    }
    const hasMasterRole = master.roles.some((ur) => ur.role.name === 'master');
    if (!hasMasterRole) {
      throw new BadRequestException('User is not a master');
    }
    // Update the order with the new master
    return this.prisma.repairOrder.update({
      where: { id: orderId },
      data: {
        masterUserId,
      },
    });
  }
}