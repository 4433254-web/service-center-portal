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
          masterUserId: data.masterId ?? data.master_user_id ?? null,
          status: 'accepted',
          issueDescription: data.issueDescription ?? data.issue_description,
          conditionAtAcceptance: data.conditionAtAcceptance ?? data.condition_at_acceptance,
          includedItems: data.includedItems ?? data.included_items ?? null,
          estimatedPrice: data.estimatedPrice ?? data.estimated_price ?? null,
          estimatedReadyAt: (data.estimatedReadyAt || data.estimated_ready_at)
            ? new Date(data.estimatedReadyAt ?? data.estimated_ready_at)
            : null,
          receiverComment: data.receiverComment ?? data.receiver_comment ?? null,
        },
        include: {
          client: { select: { id: true, fullName: true, phone: true } },
          device: { select: { id: true, brand: true, model: true, deviceType: true } },
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

  async findAll(user: any, query?: any) {
    const where: any = { deletedAt: null };

    if (user.roles.includes('master')) {
      where.masterUserId = user.id;
    }

    if (query?.search) {
      where.OR = [
        { orderNumber: { contains: query.search, mode: 'insensitive' } },
        { client: { fullName: { contains: query.search, mode: 'insensitive' } } },
        { client: { phone: { contains: query.search } } },
        { device: { imei: { contains: query.search } } },
        { device: { serialNumber: { contains: query.search } } },
        { device: { model: { contains: query.search, mode: 'insensitive' } } },
      ];
    }

    if (query?.status) {
      where.status = query.status;
    }

    const page = Number(query?.page ?? 1);
    const limit = Number(query?.limit ?? 20);
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.repairOrder.findMany({
        where,
        include: {
          client: { select: { id: true, fullName: true, phone: true } },
          device: { select: { id: true, brand: true, model: true, deviceType: true } },
          masterUser: { select: { id: true, login: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.repairOrder.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async findOne(id: string, user: any) {
    const order = await this.prisma.repairOrder.findFirst({
      where: { id, deletedAt: null },
      include: {
        client: true,
        device: true,
        receiverUser: { select: { id: true, login: true } },
        masterUser: { select: { id: true, login: true } },
        statusHistory: { orderBy: { createdAt: 'asc' } },
        comments: {
          orderBy: { createdAt: 'asc' },
          include: { user: { select: { id: true, login: true } } },
        },
        documents: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!order) throw new NotFoundException('Order not found');

    if (user.roles.includes('master') && order.masterUserId !== user.id) {
      throw new ForbiddenException('Access denied');
    }

    // Hide master_comment from manager
    if (user.roles.includes('manager')) {
      return { ...order, masterComment: undefined };
    }

    return order;
  }

  async update(id: string, data: any, user: any) {
    const order = await this.prisma.repairOrder.findFirst({
      where: { id, deletedAt: null },
    });

    if (!order) throw new NotFoundException('Order not found');

    if (user.roles.includes('master') && order.masterUserId !== user.id) {
      throw new ForbiddenException('Access denied');
    }

    if (user.roles.includes('manager')) {
      throw new ForbiddenException('Manager cannot edit orders');
    }

    return this.prisma.repairOrder.update({
      where: { id },
      data,
    });
  }

  async changeStatus(orderId: string, dto: any, user: any) {
    const order = await this.prisma.repairOrder.findUnique({
      where: { id: orderId },
    });

    if (!order) throw new NotFoundException('Order not found');

    if (user.roles.includes('master') && order.masterUserId !== user.id) {
      throw new ForbiddenException('Access denied');
    }

    const current = order.status as OrderStatus;
    const next = dto.toStatus as OrderStatus;

    this.statusPolicy.validateRole(user.roles, next);

    const allowed = ORDER_STATUS_TRANSITIONS[current] ?? [];
    if (!allowed.includes(next)) {
      throw new BadRequestException(`Invalid transition from ${current} to ${next}`);
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
      include: {
        user: { select: { id: true, login: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getComments(orderId: string, user: any) {
    const where: any = { orderId };

    // Only admin/receiver/master can see internal comments
    if (user.roles.includes('manager')) {
      where.isInternal = false;
    }

    return this.prisma.orderComment.findMany({
      where,
      include: {
        user: { select: { id: true, login: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async addComment(orderId: string, data: any, user: any) {
    const order = await this.prisma.repairOrder.findFirst({
      where: { id: orderId, deletedAt: null },
    });

    if (!order) throw new NotFoundException('Order not found');

    if (user.roles.includes('manager')) {
      throw new ForbiddenException('Manager cannot add comments');
    }

    return this.prisma.orderComment.create({
      data: {
        orderId,
        userId: user.id,
        commentText: data.commentText ?? data.comment_text,
        isInternal: data.isInternal ?? data.is_internal ?? false,
      },
      include: {
        user: { select: { id: true, login: true } },
      },
    });
  }

  async getDocuments(orderId: string) {
    return this.prisma.document.findMany({
      where: { orderId },
      orderBy: { createdAt: 'desc' },
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

  async delete(id: string) {
    return this.prisma.repairOrder.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
