import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: any) {
    return this.prisma.repairOrder.create({
      data: {
        orderNumber: `SC-${new Date().getFullYear()}-000001`,
        clientId: data.clientId,
        deviceId: data.deviceId,
        receiverUserId: data.receiverUserId ?? '00000000-0000-0000-0000-000000000000',
        masterUserId: data.masterId ?? null,
        status: 'accepted',
        issueDescription: data.issueDescription,
        conditionAtAcceptance: data.conditionAtAcceptance,
        includedItems: data.includedItems ?? null,
        estimatedPrice: data.estimatedPrice ?? null,
        estimatedReadyAt: data.estimatedReadyAt ? new Date(data.estimatedReadyAt) : null,
        receiverComment: data.receiverComment ?? null,
      },
    });
  }

  async findAll() {
    return this.prisma.repairOrder.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
      include: {
        client: true,
        device: true,
      },
    });
  }
}