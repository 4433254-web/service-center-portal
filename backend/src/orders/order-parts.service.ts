import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class OrderPartsService {
  constructor(private readonly prisma: PrismaService) {}

  async getByOrder(orderId: string) {
    const parts = await this.prisma.orderPart.findMany({
      where: { orderId },
      include: { user: { select: { id: true, login: true } } },
      orderBy: { createdAt: 'asc' },
    });
    const total = parts.reduce((s, p) => s + Number(p.price) * p.quantity, 0);
    return { parts, total };
  }

  async addPart(orderId: string, data: any, user: any) {
    const order = await this.prisma.repairOrder.findFirst({ where: { id: orderId, deletedAt: null } });
    if (!order) throw new NotFoundException('Order not found');
    if (user.roles.includes('manager')) throw new ForbiddenException('No permission');

    const part = await this.prisma.orderPart.create({
      data: { orderId, name: data.name, quantity: Number(data.quantity) || 1, price: Number(data.price) || 0, note: data.note ?? null, addedBy: user.id },
      include: { user: { select: { id: true, login: true } } },
    });
    await this.recalc(orderId);
    return part;
  }

  async updatePart(partId: string, data: any) {
    const part = await this.prisma.orderPart.findUnique({ where: { id: partId } });
    if (!part) throw new NotFoundException('Part not found');
    const updated = await this.prisma.orderPart.update({
      where: { id: partId },
      data: {
        name:     data.name     ?? part.name,
        quantity: data.quantity !== undefined ? Number(data.quantity) : part.quantity,
        price:    data.price    !== undefined ? Number(data.price)    : part.price,
        note:     data.note     !== undefined ? data.note             : part.note,
      },
    });
    await this.recalc(part.orderId);
    return updated;
  }

  async deletePart(partId: string) {
    const part = await this.prisma.orderPart.findUnique({ where: { id: partId } });
    if (!part) throw new NotFoundException('Part not found');
    await this.prisma.orderPart.delete({ where: { id: partId } });
    await this.recalc(part.orderId);
    return { deleted: true };
  }

  async updateOrderPrice(orderId: string, data: { laborCost?: number; finalPrice?: number }, user: any) {
    const order = await this.prisma.repairOrder.findFirst({ where: { id: orderId, deletedAt: null } });
    if (!order) throw new NotFoundException('Order not found');
    if (user.roles.includes('manager')) throw new ForbiddenException('No permission');

    const labor   = data.laborCost !== undefined ? Number(data.laborCost) : Number(order.laborCost ?? 0);
    const parts   = Number(order.partsCost ?? 0);
    const auto    = labor + parts;

    return this.prisma.repairOrder.update({
      where: { id: orderId },
      data: {
        ...(data.laborCost  !== undefined && { laborCost:  data.laborCost }),
        finalPrice: data.finalPrice !== undefined ? data.finalPrice : (auto > 0 ? auto : null),
      },
    });
  }

  private async recalc(orderId: string) {
    const parts = await this.prisma.orderPart.findMany({ where: { orderId } });
    const partsCost = parts.reduce((s, p) => s + Number(p.price) * p.quantity, 0);
    await this.prisma.repairOrder.update({ where: { id: orderId }, data: { partsCost } });
    return partsCost;
  }
}
