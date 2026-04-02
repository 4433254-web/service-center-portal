import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import * as fs from 'fs';
import * as path from 'path';
import * as QRCode from 'qrcode';

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

    // Generate QR code as SVG string
    const orderUrl = `${process.env.APP_URL ?? 'http://localhost:3002'}/orders/${orderId}`;
    const qrSvg = await QRCode.toString(orderUrl, { type: 'svg', width: 120, margin: 1 });

    const html = this.buildReceiptHtml(order, qrSvg, orderUrl);

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

    const orderUrl = `${process.env.APP_URL ?? 'http://localhost:3002'}/orders/${doc.orderId}`;
    const qrSvg = await QRCode.toString(orderUrl, { type: 'svg', width: 120, margin: 1 });

    return { html: this.buildReceiptHtml(order, qrSvg, orderUrl) };
  }

  private buildReceiptHtml(order: any, qrSvg: string, orderUrl: string): string {
    const formatDate = (d: Date | string | null) => {
      if (!d) return '—';
      return new Date(d).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    };
    const formatDateShort = (d: Date | string | null) => {
      if (!d) return '—';
      return new Date(d).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };
    const formatPrice = (p: any) => {
      if (!p) return 'По результатам диагностики';
      return `${Number(p).toLocaleString('ru-RU')} руб.`;
    };
    const deviceTypeMap: Record<string, string> = {
      phone: 'Телефон', tablet: 'Планшет', laptop: 'Ноутбук', pc: 'Компьютер', other: 'Другое',
    };
    const statusMap: Record<string, string> = {
      accepted: 'Принят', in_diagnostics: 'На диагностике',
      waiting_approval: 'Ожидание согласования', in_progress: 'В работе',
      ready: 'Готов', issued: 'Выдан', cancelled: 'Отменён', new: 'Новый',
    };

    const copy = (label: string) => `
    <div class="page">
      <div class="header">
        <div class="header-left">
          <div class="company-name">Сервисный центр</div>
          <div class="company-info">Ремонт телефонов, планшетов, компьютеров</div>
        </div>
        <div class="header-right">
          <div class="qr-wrap">${qrSvg}<div class="qr-label">Открыть заказ</div></div>
        </div>
      </div>

      <div class="doc-title">КВИТАНЦИЯ О ПРИЁМЕ УСТРОЙСТВА В РЕМОНТ</div>
      <div class="copy-label">${label}</div>

      <div class="grid2">
        <div class="block">
          <div class="block-title">📋 Заказ</div>
          <div class="row"><span class="lbl">Номер заказа</span><span class="val bold mono">${order.orderNumber}</span></div>
          <div class="row"><span class="lbl">Дата приёма</span><span class="val">${formatDate(order.createdAt)}</span></div>
          <div class="row"><span class="lbl">Статус</span><span class="val">${statusMap[order.status] ?? order.status}</span></div>
          <div class="row"><span class="lbl">Приёмщик</span><span class="val">${order.receiverUser?.login ?? '—'}</span></div>
          ${order.masterUser ? `<div class="row"><span class="lbl">Мастер</span><span class="val">${order.masterUser.login}</span></div>` : ''}
        </div>
        <div class="block">
          <div class="block-title">👤 Клиент</div>
          <div class="row"><span class="lbl">ФИО / Организация</span><span class="val bold">${order.client?.fullName ?? '—'}</span></div>
          <div class="row"><span class="lbl">Телефон</span><span class="val">${order.client?.phone ?? '—'}</span></div>
          ${order.client?.phoneExtra ? `<div class="row"><span class="lbl">Доп. телефон</span><span class="val">${order.client.phoneExtra}</span></div>` : ''}
          ${order.client?.email ? `<div class="row"><span class="lbl">Email</span><span class="val">${order.client.email}</span></div>` : ''}
        </div>
      </div>

      <div class="block">
        <div class="block-title">📱 Устройство</div>
        <div class="grid3">
          <div class="row"><span class="lbl">Тип</span><span class="val">${deviceTypeMap[order.device?.deviceType] ?? order.device?.deviceType ?? '—'}</span></div>
          <div class="row"><span class="lbl">Бренд</span><span class="val bold">${order.device?.brand ?? '—'}</span></div>
          <div class="row"><span class="lbl">Модель</span><span class="val bold">${order.device?.model ?? '—'}</span></div>
          ${order.device?.modification ? `<div class="row"><span class="lbl">Модификация</span><span class="val">${order.device.modification}</span></div>` : ''}
          ${order.device?.color ? `<div class="row"><span class="lbl">Цвет</span><span class="val">${order.device.color}</span></div>` : ''}
          ${order.device?.imei ? `<div class="row"><span class="lbl">IMEI</span><span class="val mono">${order.device.imei}</span></div>` : ''}
          ${order.device?.serialNumber ? `<div class="row"><span class="lbl">Серийный №</span><span class="val mono">${order.device.serialNumber}</span></div>` : ''}
        </div>
      </div>

      <div class="block">
        <div class="block-title">🔧 Неисправность и состояние</div>
        <div class="row-full"><span class="lbl">Заявленная неисправность</span><div class="val-text">${order.issueDescription ?? '—'}</div></div>
        <div class="row-full"><span class="lbl">Внешнее состояние при приёме</span><div class="val-text">${order.conditionAtAcceptance ?? '—'}</div></div>
        <div class="row-full"><span class="lbl">Комплектация / переданные предметы</span><div class="val-text">${order.includedItems || '—'}</div></div>
      </div>

      <div class="block conditions">
        <div class="block-title">💰 Предварительные условия</div>
        <div class="grid2-inner">
          <div class="row"><span class="lbl">Предварительная стоимость</span><span class="val bold price">${formatPrice(order.estimatedPrice)}</span></div>
          <div class="row"><span class="lbl">Предв. срок готовности</span><span class="val">${order.estimatedReadyAt ? formatDateShort(order.estimatedReadyAt) : 'По результатам диагностики'}</span></div>
        </div>
        ${order.receiverComment ? `<div class="row-full"><span class="lbl">Примечание</span><div class="val-text">${order.receiverComment}</div></div>` : ''}
      </div>

      <div class="signatures">
        <div class="sig-block">
          <div class="sig-name">Клиент: <span>${order.client?.fullName ?? '________________'}</span></div>
          <div class="sig-line"></div>
          <div class="sig-hint">подпись / дата</div>
        </div>
        <div class="sig-block">
          <div class="sig-name">Сотрудник: <span>${order.receiverUser?.login ?? '________________'}</span></div>
          <div class="sig-line"></div>
          <div class="sig-hint">подпись / дата</div>
        </div>
      </div>

      <div class="footer">
        <div>Документ сформирован: ${formatDate(new Date())}</div>
        <div class="footer-url">${orderUrl}</div>
      </div>
    </div>`;

    return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <title>Квитанция ${order.orderNumber}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Arial',sans-serif;font-size:11pt;color:#111;background:#f0f0f0;padding:12px}
    .page{max-width:780px;margin:0 auto 20px;background:#fff;padding:24px 28px;border:1px solid #ddd;border-radius:4px;page-break-after:always}
    .header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2.5px solid #1a3a6b;padding-bottom:12px;margin-bottom:14px}
    .company-name{font-size:18pt;font-weight:bold;color:#1a3a6b;letter-spacing:-0.5px}
    .company-info{font-size:9pt;color:#666;margin-top:3px}
    .qr-wrap{text-align:center}
    .qr-wrap svg{width:90px;height:90px;display:block}
    .qr-label{font-size:7.5pt;color:#888;margin-top:2px;text-align:center}
    .doc-title{text-align:center;font-size:13pt;font-weight:bold;text-transform:uppercase;letter-spacing:0.5px;margin:10px 0 4px;color:#1a3a6b}
    .copy-label{text-align:center;font-size:8.5pt;color:#999;margin-bottom:14px;font-style:italic}
    .block{background:#f9f9fb;border:1px solid #e8e8ed;border-radius:4px;padding:10px 14px;margin-bottom:10px}
    .block-title{font-size:9pt;font-weight:bold;color:#1a3a6b;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;border-bottom:1px solid #dde;padding-bottom:4px}
    .grid2{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px}
    .grid2-inner{display:grid;grid-template-columns:1fr 1fr;gap:8px}
    .grid3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:4px}
    .row{display:flex;flex-direction:column;margin-bottom:5px}
    .row-full{margin-bottom:6px}
    .lbl{font-size:8pt;color:#888;font-weight:normal}
    .val{font-size:10pt;color:#111;margin-top:1px}
    .val-text{font-size:10pt;color:#111;margin-top:2px;padding:4px 6px;background:#fff;border:1px solid #e0e0e0;border-radius:3px;min-height:22px}
    .bold{font-weight:bold}
    .mono{font-family:monospace;font-size:9.5pt;letter-spacing:0.3px}
    .price{font-size:12pt;color:#1a3a6b}
    .conditions{border-left:3px solid #1a3a6b}
    .signatures{display:grid;grid-template-columns:1fr 1fr;gap:40px;margin:18px 0 14px}
    .sig-name{font-size:9pt;color:#555;margin-bottom:6px}
    .sig-name span{font-weight:bold;color:#111}
    .sig-line{border-bottom:1px solid #333;margin:32px 0 4px}
    .sig-hint{font-size:7.5pt;color:#aaa;text-align:center}
    .footer{border-top:1px solid #ddd;padding-top:8px;font-size:7.5pt;color:#aaa;text-align:center}
    .footer-url{font-size:7pt;color:#bbb;margin-top:2px;font-family:monospace}
    .divider{border:none;border-top:2px dashed #ccc;margin:8px 0 20px;display:block}
    @media print{
      body{background:#fff;padding:0}
      .page{border:none;border-radius:0;padding:16px;margin:0;box-shadow:none;page-break-after:always}
      .page:last-child{page-break-after:avoid}
      .block{break-inside:avoid}
    }
  </style>
</head>
<body>
  ${copy('Экземпляр для клиента')}
  <hr class="divider no-print">
  ${copy('Экземпляр для сервисного центра')}
</body>
</html>`;
  }
}

