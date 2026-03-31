import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class DocumentsService {
  constructor(private readonly prisma: PrismaService) {}

  async generateReceipt(orderId: string, user: any) {
    const order = await this.prisma.repairOrder.findFirst({
      where: { id: orderId, deletedAt: null },
      include: {
        client: true,
        device: true,
        receiverUser: { select: { id: true, login: true } },
        masterUser: { select: { id: true, login: true } },
      },
    });

    if (!order) throw new NotFoundException('Order not found');

    // Generate HTML receipt
    const html = this.buildReceiptHtml(order);

    // Store as HTML file (in production, use S3; in dev, use local storage)
    const uploadsDir = path.join(process.cwd(), 'uploads', 'documents');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const filename = `receipt_${order.orderNumber}_${Date.now()}.html`;
    const filePath = path.join(uploadsDir, filename);
    fs.writeFileSync(filePath, html, 'utf-8');

    const storageKey = path.join('uploads', 'documents', filename);

    const document = await this.prisma.document.create({
      data: {
        orderId,
        documentType: 'receipt',
        storageBucket: 'local',
        storageKey,
        generatedBy: user.id,
      },
    });

    return {
      ...document,
      url: `/api/documents/${document.id}/view`,
    };
  }

  async getDocument(id: string) {
    const doc = await this.prisma.document.findUnique({ where: { id } });
    if (!doc) throw new NotFoundException('Document not found');
    return doc;
  }

  async viewDocument(id: string): Promise<{ html: string }> {
    const doc = await this.getDocument(id);

    const order = await this.prisma.repairOrder.findFirst({
      where: { id: doc.orderId },
      include: {
        client: true,
        device: true,
        receiverUser: { select: { id: true, login: true } },
        masterUser: { select: { id: true, login: true } },
      },
    });

    if (!order) throw new NotFoundException('Order not found');

    return { html: this.buildReceiptHtml(order) };
  }

  private buildReceiptHtml(order: any): string {
    const formatDate = (d: Date | string | null) => {
      if (!d) return '—';
      return new Date(d).toLocaleString('ru-RU');
    };

    const formatPrice = (p: any) => {
      if (!p) return '—';
      return `${Number(p).toFixed(2)} руб.`;
    };

    const statusMap: Record<string, string> = {
      accepted: 'Принят',
      in_diagnostics: 'На диагностике',
      waiting_approval: 'Ожидание согласования',
      in_progress: 'В работе',
      ready: 'Готов',
      issued: 'Выдан',
      cancelled: 'Отменён',
      new: 'Новый',
    };

    return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <title>Квитанция ${order.orderNumber}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; font-size: 12pt; color: #000; background: #fff; padding: 20px; }
    .page { max-width: 800px; margin: 0 auto; padding: 20px; border: 1px solid #ccc; }
    h1 { font-size: 18pt; text-align: center; margin-bottom: 4px; }
    .subtitle { text-align: center; font-size: 10pt; color: #666; margin-bottom: 16px; }
    .doc-title { font-size: 14pt; font-weight: bold; text-align: center; margin: 16px 0; border-top: 2px solid #000; border-bottom: 2px solid #000; padding: 8px; }
    .section { margin: 12px 0; }
    .section-title { font-weight: bold; font-size: 11pt; border-bottom: 1px solid #999; padding-bottom: 4px; margin-bottom: 8px; }
    table { width: 100%; border-collapse: collapse; }
    td { padding: 4px 8px; vertical-align: top; }
    td:first-child { font-weight: bold; width: 40%; color: #333; }
    .signatures { margin-top: 32px; display: flex; justify-content: space-between; }
    .sig-block { width: 45%; }
    .sig-line { border-top: 1px solid #000; margin-top: 40px; text-align: center; font-size: 9pt; color: #666; padding-top: 4px; }
    .footer { margin-top: 24px; font-size: 9pt; color: #666; text-align: center; border-top: 1px solid #ccc; padding-top: 8px; }
    @media print { body { padding: 0; } .page { border: none; } }
  </style>
</head>
<body>
  <div class="page">
    <h1>Сервисный центр</h1>
    <div class="subtitle">Ремонт телефонов, планшетов, компьютеров</div>

    <div class="doc-title">КВИТАНЦИЯ О ПРИЁМЕ УСТРОЙСТВА В РЕМОНТ</div>

    <div class="section">
      <div class="section-title">Заказ</div>
      <table>
        <tr><td>Номер заказа:</td><td><strong>${order.orderNumber}</strong></td></tr>
        <tr><td>Дата и время приёма:</td><td>${formatDate(order.createdAt)}</td></tr>
        <tr><td>Статус:</td><td>${statusMap[order.status] ?? order.status}</td></tr>
      </table>
    </div>

    <div class="section">
      <div class="section-title">Клиент</div>
      <table>
        <tr><td>ФИО / Организация:</td><td>${order.client?.fullName ?? '—'}</td></tr>
        <tr><td>Телефон:</td><td>${order.client?.phone ?? '—'}</td></tr>
        ${order.client?.phoneExtra ? `<tr><td>Доп. телефон:</td><td>${order.client.phoneExtra}</td></tr>` : ''}
      </table>
    </div>

    <div class="section">
      <div class="section-title">Устройство</div>
      <table>
        <tr><td>Тип:</td><td>${order.device?.deviceType ?? '—'}</td></tr>
        <tr><td>Бренд:</td><td>${order.device?.brand ?? '—'}</td></tr>
        <tr><td>Модель:</td><td>${order.device?.model ?? '—'}</td></tr>
        ${order.device?.modification ? `<tr><td>Модификация:</td><td>${order.device.modification}</td></tr>` : ''}
        ${order.device?.color ? `<tr><td>Цвет:</td><td>${order.device.color}</td></tr>` : ''}
        ${order.device?.imei ? `<tr><td>IMEI:</td><td>${order.device.imei}</td></tr>` : ''}
        ${order.device?.serialNumber ? `<tr><td>Серийный номер:</td><td>${order.device.serialNumber}</td></tr>` : ''}
      </table>
    </div>

    <div class="section">
      <div class="section-title">Неисправность и состояние</div>
      <table>
        <tr><td>Заявленная неисправность:</td><td>${order.issueDescription ?? '—'}</td></tr>
        <tr><td>Состояние при приёме:</td><td>${order.conditionAtAcceptance ?? '—'}</td></tr>
        <tr><td>Комплектация:</td><td>${order.includedItems ?? '—'}</td></tr>
      </table>
    </div>

    <div class="section">
      <div class="section-title">Предварительные условия</div>
      <table>
        <tr><td>Предварительная стоимость:</td><td>${formatPrice(order.estimatedPrice)}</td></tr>
        <tr><td>Предв. срок готовности:</td><td>${formatDate(order.estimatedReadyAt)}</td></tr>
      </table>
    </div>

    <div class="signatures">
      <div class="sig-block">
        <div class="sig-line">Подпись клиента</div>
      </div>
      <div class="sig-block">
        <div class="sig-line">Подпись сотрудника (${order.receiverUser?.login ?? '—'})</div>
      </div>
    </div>

    <div class="footer">
      Документ сформирован: ${formatDate(new Date())}
    </div>
  </div>
</body>
</html>`;
  }
}
