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

const ORDER_INCLUDE = {
  client: true,
  device: true,
  receiverUser: { select: { id: true, login: true } },
  masterUser: { select: { id: true, login: true } },
};

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
          masterUserId: data.masterUserId ?? data.masterId ?? null,
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
        include: ORDER_INCLUDE,
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

  async findAll(query: any, user: any) {
    const where: any = { deletedAt: null };

    if (user.roles.includes('master') && !user.roles.includes('admin')) {
      where.masterUserId = user.id;
    }

    if (query.search) {
      where.OR = [
        { orderNumber: { contains: query.search, mode: 'insensitive' } },
        { client: { fullName: { contains: query.search, mode: 'insensitive' } } },
        { client: { phone: { contains: query.search } } },
        { device: { brand: { contains: query.search, mode: 'insensitive' } } },
        { device: { model: { contains: query.search, mode: 'insensitive' } } },
        { device: { imei: { contains: query.search } } },
      ];
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.masterUserId) {
      where.masterUserId = query.masterUserId;
    }

    const page = parseInt(query.page ?? '1');
    const limit = parseInt(query.limit ?? '20');
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.repairOrder.findMany({
        where,
        include: ORDER_INCLUDE,
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
        ...ORDER_INCLUDE,
        statusHistory: {
          orderBy: { createdAt: 'asc' },
          include: { user: { select: { id: true, login: true } } },
        },
        comments: {
          orderBy: { createdAt: 'asc' },
          include: { user: { select: { id: true, login: true } } },
        },
        documents: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!order) throw new NotFoundException('Order not found');

    if (
      user.roles.includes('master') &&
      !user.roles.includes('admin') &&
      order.masterUserId !== user.id
    ) {
      throw new ForbiddenException('Access denied');
    }

    return order;
  }

  async update(id: string, data: any, user: any) {
    await this.findOne(id, user);
    return this.prisma.repairOrder.update({
      where: { id },
      data: {
        masterUserId: data.masterUserId,
        estimatedPrice: data.estimatedPrice,
        estimatedReadyAt: data.estimatedReadyAt
          ? new Date(data.estimatedReadyAt)
          : undefined,
        receiverComment: data.receiverComment,
        masterComment: data.masterComment,
        includedItems: data.includedItems,
      },
      include: ORDER_INCLUDE,
    });
  }

  async changeStatus(orderId: string, dto: any, user: any) {
    const order = await this.prisma.repairOrder.findUnique({
      where: { id: orderId },
    });

    if (!order) throw new NotFoundException('Order not found');

    if (
      user.roles.includes('master') &&
      !user.roles.includes('admin') &&
      order.masterUserId !== user.id
    ) {
      throw new ForbiddenException('Access denied');
    }

    const current = order.status as OrderStatus;
    const next = dto.toStatus as OrderStatus;

    this.statusPolicy.validateRole(user.roles, next);

    const allowed = ORDER_STATUS_TRANSITIONS[current] ?? [];
    if (!allowed.includes(next)) {
      throw new BadRequestException(
        `Transition from ${current} to ${next} is not allowed`,
      );
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
        include: ORDER_INCLUDE,
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
      include: {
        user: { select: { id: true, login: true } },
      },
    });
  }

  async getComments(orderId: string, user: any) {
    const where: any = { orderId };
    if (!user.roles.includes('admin') && !user.roles.includes('receiver')) {
      where.isInternal = false;
    }
    return this.prisma.orderComment.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      include: { user: { select: { id: true, login: true } } },
    });
  }

  async addComment(orderId: string, data: any, user: any) {
    return this.prisma.orderComment.create({
      data: {
        orderId,
        userId: user.id,
        commentText: data.commentText,
        isInternal: data.isInternal ?? false,
      },
      include: { user: { select: { id: true, login: true } } },
    });
  }

  async getFiles(orderId: string) {
    return this.prisma.file.findMany({
      where: { entityType: 'order', entityId: orderId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getDocuments(orderId: string) {
    return this.prisma.document.findMany({
      where: { orderId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
