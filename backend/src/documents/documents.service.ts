import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import * as fs from 'fs';
import * as path from 'path';
import PDFDocument = require('pdfkit');

@Injectable()
export class DocumentsService {
  constructor(private readonly prisma: PrismaService) {}

  async generateReceipt(orderId: string, user: any) {
    const order = await this.prisma.repairOrder.findUnique({
      where: { id: orderId },
      include: {
        client: true,
        device: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const receiptData = this.buildReceiptData(order);
    const savedFile = this.saveReceiptPdfToDisk(order.id, receiptData);

    const document = await this.prisma.document.create({
      data: {
        orderId: order.id,
        documentType: 'receipt',
        storageBucket: 'local',
        storageKey: savedFile.storageKey,
        generatedBy: user.id,
      },
    });

    return {
      success: true,
      data: {
        documentId: document.id,
        documentType: document.documentType,
        orderId: document.orderId,
        storageBucket: document.storageBucket,
        fileName: path.basename(document.storageKey),
        createdAt: document.createdAt,
      },
    };
  }

  async getOne(id: string, user: any) {
    const document = await this.getDocumentEntity(id, user);

    return {
      id: document.id,
      orderId: document.orderId,
      documentType: document.documentType,
      storageBucket: document.storageBucket,
      fileName: path.basename(document.storageKey),
      generatedBy: document.generatedBy,
      createdAt: document.createdAt,
    };
  }

  async getDownloadFile(id: string, user: any) {
    const document = await this.getDocumentEntity(id, user);

    return {
      storageKey: document.storageKey,
      fileName: path.basename(document.storageKey),
    };
  }

  private async getDocumentEntity(id: string, user: any) {
    const document = await this.prisma.document.findUnique({
      where: { id },
      include: {
        order: true,
      },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    if (user.roles.includes('master') && document.order.masterUserId !== user.id) {
      throw new ForbiddenException('Access denied');
    }

    return document;
  }

  private buildReceiptData(order: any) {
    return {
      serviceCenter: {
        name: 'Service Center',
        phone: '',
        address: '',
        email: '',
      },
      order: {
        id: order.id,
        number: order.orderNumber,
        status: order.status,
        createdAt: order.createdAt,
      },
      client: {
        fullName: order.client.fullName,
        phone: order.client.phone,
        phoneExtra: order.client.phoneExtra,
      },
      device: {
        type: order.device.deviceType,
        brand: order.device.brand,
        model: order.device.model,
        modification: order.device.modification,
        color: order.device.color,
        imei: order.device.imei,
        serialNumber: order.device.serialNumber,
      },
      acceptance: {
        issueDescription: order.issueDescription,
        conditionAtAcceptance: order.conditionAtAcceptance,
        includedItems: order.includedItems,
      },
      estimate: {
        estimatedPrice: order.estimatedPrice,
        estimatedReadyAt: order.estimatedReadyAt,
      },
      signatures: {
        clientSignature: null,
        employeeSignature: null,
      },
    };
  }

  private saveReceiptPdfToDisk(orderId: string, receiptData: any) {
    const documentsDir = path.join(process.cwd(), 'uploads', 'documents');

    if (!fs.existsSync(documentsDir)) {
      fs.mkdirSync(documentsDir, { recursive: true });
    }

    const fileName = `receipt-${orderId}-${Date.now()}.pdf`;
    const absolutePath = path.join(documentsDir, fileName);

    const doc = new PDFDocument({
      size: 'A4',
      margin: 50,
    });

    const stream = fs.createWriteStream(absolutePath);
    doc.pipe(stream);

    const lineGap = 6;

    doc.fontSize(18).text(receiptData.serviceCenter.name, { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(16).text('Receipt', { align: 'center' });
    doc.moveDown(1);

    this.writeSectionTitle(doc, 'Order');
    this.writeField(doc, 'Order number', receiptData.order.number, lineGap);
    this.writeField(doc, 'Status', receiptData.order.status, lineGap);
    this.writeField(doc, 'Created at', this.formatValue(receiptData.order.createdAt), lineGap);
    doc.moveDown(0.7);

    this.writeSectionTitle(doc, 'Client');
    this.writeField(doc, 'Full name', receiptData.client.fullName, lineGap);
    this.writeField(doc, 'Phone', receiptData.client.phone, lineGap);
    this.writeField(doc, 'Extra phone', receiptData.client.phoneExtra, lineGap);
    doc.moveDown(0.7);

    this.writeSectionTitle(doc, 'Device');
    this.writeField(doc, 'Type', receiptData.device.type, lineGap);
    this.writeField(doc, 'Brand', receiptData.device.brand, lineGap);
    this.writeField(doc, 'Model', receiptData.device.model, lineGap);
    this.writeField(doc, 'Modification', receiptData.device.modification, lineGap);
    this.writeField(doc, 'Color', receiptData.device.color, lineGap);
    this.writeField(doc, 'IMEI', receiptData.device.imei, lineGap);
    this.writeField(doc, 'Serial number', receiptData.device.serialNumber, lineGap);
    doc.moveDown(0.7);

    this.writeSectionTitle(doc, 'Acceptance');
    this.writeField(doc, 'Issue description', receiptData.acceptance.issueDescription, lineGap);
    this.writeField(
      doc,
      'Condition at acceptance',
      receiptData.acceptance.conditionAtAcceptance,
      lineGap,
    );
    this.writeField(doc, 'Included items', receiptData.acceptance.includedItems, lineGap);
    doc.moveDown(0.7);

    this.writeSectionTitle(doc, 'Estimate');
    this.writeField(doc, 'Estimated price', receiptData.estimate.estimatedPrice, lineGap);
    this.writeField(doc, 'Estimated ready at', receiptData.estimate.estimatedReadyAt, lineGap);
    doc.moveDown(1.5);

    this.writeSectionTitle(doc, 'Signatures');
    doc.fontSize(12).text('Client signature: __________________');
    doc.moveDown(1);
    doc.fontSize(12).text('Employee signature: ________________');

    doc.end();

    return {
      fileName,
      storageKey: absolutePath,
    };
  }

  private writeSectionTitle(doc: PDFKit.PDFDocument, title: string) {
    doc.fontSize(14).text(title);
    doc.moveDown(0.3);
  }

  private writeField(
    doc: PDFKit.PDFDocument,
    label: string,
    value: unknown,
    lineGap = 4,
  ) {
    doc.fontSize(12).text(`${label}: ${this.formatValue(value)}`, {
      lineGap,
    });
  }

  private formatValue(value: unknown) {
    if (value === null || value === undefined || value === '') {
      return '';
    }

    if (value instanceof Date) {
      return value.toISOString();
    }

    return String(value);
  }
}