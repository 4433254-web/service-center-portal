import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class OrderStatusHistoryService {
  constructor(private readonly prisma: PrismaService) {}

  async log(params: {
    orderId: string;
    fromStatus: string | null;
    toStatus: string;
    userId: string;
    comment?: string;
  }) {
    return this.prisma.orderStatusHistory.create({
      data: {
        orderId: params.orderId,
        fromStatus: params.fromStatus,
        toStatus: params.toStatus,
        userId: params.userId,
        comment: params.comment,
      },
    });
  }
}
