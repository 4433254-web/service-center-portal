import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import * as fs from 'fs';
import * as path from 'path';
import * as QRCode from 'qrcode';

@Injectable()
export class DocumentsService {
  constructor(private readonly prisma: PrismaService) {}

  async generateReceipt(orderId: string, user: any) {
    const order = await this.getOrderFull(orderId);
    const qrSvg = await QRCode.toString(this.orderUrl(orderId), { type: 'svg', width: 80, margin: 0 });
    const html = this.buildAcceptanceHtml(order, qrSvg);
    const doc = await this.saveDocument(orderId, 'receipt', html, user.id);
    return { ...doc, url: `/api/documents/${doc.id}/view` };
  }

  async generateIssueReceipt(orderId: string, user: any) {
    const order = await this.getOrderFull(orderId);
    const qrSvg = await QRCode.toString(this.orderUrl(orderId), { type: 'svg', width: 80, margin: 0 });
    const html = this.buildIssueHtml(order, qrSvg);
    const doc = await this.saveDocument(orderId, 'issue_receipt', html, user.id);
    return { ...doc, url: `/api/documents/${doc.id}/view` };
  }

  private orderUrl(orderId: string) {
    return `${process.env.APP_URL ?? 'https://servis.leto-pg.ru'}/orders/${orderId}`;
  }

  private async getOrderFull(orderId: string) {
    const order = await this.prisma.repairOrder.findFirst({
      where: { id: orderId, deletedAt: null },
      include: {
        client: true,
        device: true,
        receiverUser: { select: { id: true, login: true } },
        masterUser:   { select: { id: true, login: true } },
      },
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  private async saveDocument(orderId: string, type: string, html: string, userId: string) {
    const dir = path.join(process.cwd(), 'uploads', 'documents');
    fs.mkdirSync(dir, { recursive: true });
    const filename = `${type}_${Date.now()}.html`;
    fs.writeFileSync(path.join(dir, filename), html, 'utf-8');
    return this.prisma.document.create({
      data: {
        orderId,
        documentType: type as any,
        storageBucket: 'local',
        storageKey: path.join('uploads', 'documents', filename),
        generatedBy: userId,
      },
    });
  }

  async getDocument(id: string) {
    const doc = await this.prisma.document.findUnique({ where: { id } });
    if (!doc) throw new NotFoundException('Document not found');
    return doc;
  }

  async getOrderDocuments(orderId: string) {
    return this.prisma.document.findMany({
      where: { orderId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async viewDocument(id: string): Promise<{ html: string }> {
    const doc = await this.getDocument(id);
    const order = await this.getOrderFull(doc.orderId);
    const qrSvg = await QRCode.toString(this.orderUrl(doc.orderId), { type: 'svg', width: 80, margin: 0 });
    const html = doc.documentType === 'issue_receipt'
      ? this.buildIssueHtml(order, qrSvg)
      : this.buildAcceptanceHtml(order, qrSvg);
    return { html };
  }

  // ─── форматирование ───────────────────────────────────────────
  private fmt = {
    dt:  (d: any) => d ? new Date(d).toLocaleString('ru-RU',  { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' }) : '—',
    d:   (d: any) => d ? new Date(d).toLocaleDateString('ru-RU', { day:'2-digit', month:'2-digit', year:'numeric' }) : '—',
    rub: (v: any) => v ? `${Number(v).toLocaleString('ru-RU')} ₽` : '—',
    dev: { phone:'Телефон', tablet:'Планшет', laptop:'Ноутбук', pc:'Компьютер', other:'Другое' } as Record<string,string>,
    st:  { accepted:'Принят', in_diagnostics:'На диагностике', waiting_approval:'Ожид. согласования',
           in_progress:'В работе', ready:'Готов', issued:'Выдан', cancelled:'Отменён' } as Record<string,string>,
  };

  // ─── общие стили A6 ──────────────────────────────────────────
  private get css(): string {
    return `<style>
*{box-sizing:border-box;margin:0;padding:0}
html,body{font-family:Arial,Helvetica,sans-serif;font-size:9pt;color:#111;background:#fff}
.slip{width:105mm;min-height:148mm;padding:4mm 5mm;border:.5pt solid #bbb;page-break-inside:avoid;display:inline-block;vertical-align:top;background:#fff}
.sheet{display:flex;flex-wrap:wrap;gap:4px}
@media screen{body{background:#e0e0e0;padding:8px}.slip{margin:4px;border:1pt solid #999;border-radius:3px;box-shadow:0 1px 4px rgba(0,0,0,.15)}}
@media print{@page{size:A4 portrait;margin:6mm}body{background:#fff;padding:0}.slip{margin:0;border:.5pt dashed #aaa}.sheet{display:grid;grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr;gap:2mm;width:198mm;height:282mm}}
.co{font-size:11pt;font-weight:700;color:#1a3a6b;line-height:1.1}
.co-sub{font-size:7.5pt;color:#666;margin-top:1mm}
.doc-type{font-size:8pt;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:#fff;background:#1a3a6b;padding:1.5mm 3mm;margin:2mm -5mm;text-align:center}
.doc-type.issue{background:#166534}
.sec{margin-top:2.5mm}
.sec-title{font-size:6.5pt;font-weight:700;text-transform:uppercase;letter-spacing:.4px;color:#888;border-bottom:.5pt solid #ddd;padding-bottom:.5mm;margin-bottom:1.5mm}
.row{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:.8mm;gap:2mm}
.lbl{font-size:7.5pt;color:#777;flex-shrink:0;max-width:36mm}
.val{font-size:8pt;color:#111;text-align:right;font-weight:600;word-break:break-word}
.val.mono{font-family:'Courier New',monospace;font-size:7.5pt}
.val.big{font-size:10pt;color:#1a3a6b}
.val.green{color:#166534}
.fullrow{font-size:8pt;color:#111;line-height:1.35;margin-bottom:1mm;padding:1mm 1.5mm;background:#f8f8f8;border-left:2pt solid #1a3a6b;border-radius:0 2px 2px 0}
.fullrow.g{border-left-color:#166534}
.header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:1mm}
.qr-wrap{flex-shrink:0;margin-left:2mm;text-align:center}
.qr-wrap svg{width:18mm!important;height:18mm!important;display:block}
.qr-sub{font-size:5.5pt;color:#aaa;text-align:center;margin-top:.5mm}
.sigs{display:grid;grid-template-columns:1fr 1fr;gap:4mm;margin-top:3mm}
.sig-line{border-top:.5pt solid #333;padding-top:1mm;font-size:7pt;color:#666;text-align:center;margin-top:7mm}
.total-box{background:#f0f6ff;border:.5pt solid #b6d0f5;border-radius:2px;padding:1.5mm 2mm;margin-top:2mm;display:flex;justify-content:space-between;align-items:center}
.tl{font-size:7.5pt;color:#1a3a6b;font-weight:700}
.tv{font-size:11pt;font-weight:800;color:#1a3a6b}
.total-box.g{background:#f0fdf4;border-color:#86efac}
.total-box.g .tl,.total-box.g .tv{color:#166534}
.copy{font-size:6pt;color:#bbb;text-align:center;margin-top:2mm}
</style>`;
  }

  // ─── КВИТАНЦИЯ ПРИЁМА ────────────────────────────────────────
  private buildAcceptanceHtml(order: any, qrSvg: string): string {
    const f = this.fmt;
    const slip = (label: string) => `
<div class="slip">
  <div class="header">
    <div><div class="co">Сервисный центр</div><div class="co-sub">Ремонт телефонов, планшетов, ПК</div></div>
    <div class="qr-wrap">${qrSvg}<div class="qr-sub">заказ</div></div>
  </div>
  <div class="doc-type">Квитанция приёма в ремонт</div>
  <div class="sec">
    <div class="row"><span class="lbl">Заказ</span><span class="val mono big">${order.orderNumber}</span></div>
    <div class="row"><span class="lbl">Дата приёма</span><span class="val">${f.dt(order.createdAt)}</span></div>
    <div class="row"><span class="lbl">Приёмщик</span><span class="val">${order.receiverUser?.login ?? '—'}</span></div>
  </div>
  <div class="sec">
    <div class="sec-title">Клиент</div>
    <div class="row"><span class="lbl">ФИО</span><span class="val">${order.client?.fullName ?? '—'}</span></div>
    <div class="row"><span class="lbl">Телефон</span><span class="val">${order.client?.phone ?? '—'}</span></div>
    ${order.client?.phoneExtra ? `<div class="row"><span class="lbl">Доп. тел.</span><span class="val">${order.client.phoneExtra}</span></div>` : ''}
  </div>
  <div class="sec">
    <div class="sec-title">Устройство</div>
    <div class="row"><span class="lbl">${f.dev[order.device?.deviceType] ?? 'Устройство'}</span><span class="val">${order.device?.brand ?? ''} ${order.device?.model ?? ''}</span></div>
    ${order.device?.imei ? `<div class="row"><span class="lbl">IMEI</span><span class="val mono">${order.device.imei}</span></div>` : ''}
    ${order.device?.color ? `<div class="row"><span class="lbl">Цвет</span><span class="val">${order.device.color}</span></div>` : ''}
  </div>
  <div class="sec">
    <div class="sec-title">Неисправность и состояние</div>
    <div class="fullrow">${order.issueDescription ?? '—'}</div>
    ${order.conditionAtAcceptance ? `<div class="row" style="margin-top:.5mm"><span class="lbl">Состояние</span><span class="val" style="font-size:7.5pt;font-weight:400">${order.conditionAtAcceptance}</span></div>` : ''}
    ${order.includedItems ? `<div class="row"><span class="lbl">Комплект</span><span class="val" style="font-size:7.5pt;font-weight:400">${order.includedItems}</span></div>` : ''}
  </div>
  ${order.estimatedPrice || order.estimatedReadyAt ? `
  <div class="sec">
    <div class="sec-title">Условия</div>
    ${order.estimatedPrice ? `<div class="row"><span class="lbl">Предв. стоимость</span><span class="val">${f.rub(order.estimatedPrice)}</span></div>` : ''}
    ${order.estimatedReadyAt ? `<div class="row"><span class="lbl">Срок готовности</span><span class="val">${f.d(order.estimatedReadyAt)}</span></div>` : ''}
  </div>` : ''}
  <div class="sigs">
    <div><div class="sig-line">Клиент</div></div>
    <div><div class="sig-line">Сотрудник</div></div>
  </div>
  <div class="copy">${label}</div>
</div>`;
    return `<!DOCTYPE html><html lang="ru"><head><meta charset="UTF-8"><title>Квитанция приёма ${order.orderNumber}</title>${this.css}</head><body>
<div class="sheet">${slip('Клиенту')}${slip('Сервисному центру')}${slip('Клиенту')}${slip('Сервисному центру')}</div>
<script>window.addEventListener('load',()=>{setTimeout(()=>window.print(),400)});</script>
</body></html>`;
  }

  // ─── КВИТАНЦИЯ ВЫДАЧИ ────────────────────────────────────────
  private buildIssueHtml(order: any, qrSvg: string): string {
    const f = this.fmt;
    const finalPrice  = Number((order as any).finalPrice  ?? 0);
    const laborCost   = Number((order as any).laborCost   ?? 0);
    const partsCost   = Number((order as any).partsCost   ?? 0);
    const total = finalPrice || (laborCost + partsCost) || Number(order.estimatedPrice ?? 0);
    const slip = (label: string) => `
<div class="slip">
  <div class="header">
    <div><div class="co">Сервисный центр</div><div class="co-sub">Выдача устройства из ремонта</div></div>
    <div class="qr-wrap">${qrSvg}<div class="qr-sub">заказ</div></div>
  </div>
  <div class="doc-type issue">Квитанция выдачи из ремонта</div>
  <div class="sec">
    <div class="row"><span class="lbl">Заказ</span><span class="val mono big">${order.orderNumber}</span></div>
    <div class="row"><span class="lbl">Принят</span><span class="val">${f.d(order.createdAt)}</span></div>
    <div class="row"><span class="lbl">Выдан</span><span class="val green">${f.dt((order as any).issuedAt ?? new Date())}</span></div>
  </div>
  <div class="sec">
    <div class="sec-title">Клиент</div>
    <div class="row"><span class="lbl">ФИО</span><span class="val">${order.client?.fullName ?? '—'}</span></div>
    <div class="row"><span class="lbl">Телефон</span><span class="val">${order.client?.phone ?? '—'}</span></div>
  </div>
  <div class="sec">
    <div class="sec-title">Устройство</div>
    <div class="row"><span class="lbl">${f.dev[order.device?.deviceType] ?? 'Устройство'}</span><span class="val">${order.device?.brand ?? ''} ${order.device?.model ?? ''}</span></div>
    ${order.device?.imei ? `<div class="row"><span class="lbl">IMEI</span><span class="val mono">${order.device.imei}</span></div>` : ''}
  </div>
  <div class="sec">
    <div class="sec-title">Выполненные работы</div>
    <div class="fullrow g">${order.issueDescription ?? '—'}</div>
    ${order.masterUser ? `<div class="row" style="margin-top:.5mm"><span class="lbl">Мастер</span><span class="val">${order.masterUser.login}</span></div>` : ''}
  </div>
  ${laborCost || partsCost ? `
  <div class="sec">
    <div class="sec-title">Стоимость</div>
    ${laborCost ? `<div class="row"><span class="lbl">Работы</span><span class="val">${f.rub(laborCost)}</span></div>` : ''}
    ${partsCost ? `<div class="row"><span class="lbl">Запчасти</span><span class="val">${f.rub(partsCost)}</span></div>` : ''}
  </div>` : ''}
  ${total ? `<div class="total-box g"><span class="tl">К оплате</span><span class="tv">${f.rub(total)}</span></div>` : ''}
  <div class="sigs">
    <div><div class="sig-line">Клиент получил</div></div>
    <div><div class="sig-line">Сотрудник</div></div>
  </div>
  <div class="copy">${label}</div>
</div>`;
    return `<!DOCTYPE html><html lang="ru"><head><meta charset="UTF-8"><title>Квитанция выдачи ${order.orderNumber}</title>${this.css}</head><body>
<div class="sheet">${slip('Клиенту')}${slip('Сервисному центру')}${slip('Клиенту')}${slip('Сервисному центру')}</div>
<script>window.addEventListener('load',()=>{setTimeout(()=>window.print(),400)});</script>
</body></html>`;
  }
}
