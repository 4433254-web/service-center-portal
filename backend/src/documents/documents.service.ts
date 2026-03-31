import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import * as fs from 'fs';
import * as path from 'path';
import PDFDocument = require('pdfkit');

/**
 * DocumentsService is responsible for generating and retrieving
 * PDF documents (receipts, acceptance acts, warranty certificates)
 * for repair orders. It encapsulates all logic related to data
 * preparation, PDF layout and file storage. Masters are limited to
 * viewing only their own orders.
 */
@Injectable()
export class DocumentsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generate a receipt document for the given order.
   */
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

  /**
   * Generate an acceptance act for the given order.
   */
  async generateAct(orderId: string, user: any) {
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

    const actData = this.buildActData(order);
    const savedFile = this.saveActPdfToDisk(order.id, actData);

    const document = await this.prisma.document.create({
      data: {
        orderId: order.id,
        documentType: 'act',
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

  /**
   * Generate a warranty certificate for the given order.
   */
  async generateWarranty(orderId: string, user: any) {
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

    const warrantyData = this.buildWarrantyData(order);
    const savedFile = this.saveWarrantyPdfToDisk(order.id, warrantyData);

    const document = await this.prisma.document.create({
      data: {
        orderId: order.id,
        documentType: 'warranty',
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

  /**
   * Return a list of all documents belonging to an order.
   * Masters can see only their own orders.
   */
  async getDocumentsByOrder(orderId: string, user: any) {
    const documents = await this.prisma.document.findMany({
      where: { orderId },
      include: {
        order: true,
      },
    });

    return documents
      .filter((document) => {
        // Masters can only view documents for orders assigned to them
        if (
          user.roles.includes('master') &&
          document.order?.masterUserId !== user.id
        ) {
          return false;
        }
        return true;
      })
      .map((document) => ({
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
   * Return metadata for a single document. Masters cannot access other masters' documents.
   */
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

  /**
   * Return the storage key and filename for downloading a document. Masters cannot access other masters' documents.
   */
  async getDownloadFile(id: string, user: any) {
    const document = await this.getDocumentEntity(id, user);

    return {
      storageKey: document.storageKey,
      fileName: path.basename(document.storageKey),
    };
  }

  /**
   * Find a document entity by ID, performing RBAC checks.
   */
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

    if (
      user.roles.includes('master') &&
      document.order?.masterUserId !== user.id
    ) {
      throw new ForbiddenException('Access denied');
    }

    return document;
  }

  /**
   * Build the data structure for a receipt.
   */
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

  /**
   * Build the data structure for an acceptance act. Currently mirrors receipt data for future customization.
   */
  private buildActData(order: any) {
    return this.buildReceiptData(order);
  }

  /**
   * Build the data structure for a warranty certificate. Currently mirrors receipt data for future customization.
   */
  private buildWarrantyData(order: any) {
    return this.buildReceiptData(order);
  }

  /**
   * Write a receipt PDF to disk.
   */
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

    // Unified header: service center details and document title
    this.writeHeader(doc, 'Receipt', receiptData.serviceCenter);

    this.writeSectionTitle(doc, 'Order');
    this.writeField(doc, 'Order number', receiptData.order.number, lineGap);
    this.writeField(doc, 'Status', receiptData.order.status, lineGap);
    this.writeField(
      doc,
      'Created at',
      this.formatValue(receiptData.order.createdAt),
      lineGap,
    );
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
    this.writeField(
      doc,
      'Modification',
      receiptData.device.modification,
      lineGap,
    );
    this.writeField(doc, 'Color', receiptData.device.color, lineGap);
    this.writeField(doc, 'IMEI', receiptData.device.imei, lineGap);
    this.writeField(
      doc,
      'Serial number',
      receiptData.device.serialNumber,
      lineGap,
    );
    doc.moveDown(0.7);

    this.writeSectionTitle(doc, 'Acceptance');
    this.writeField(
      doc,
      'Issue description',
      receiptData.acceptance.issueDescription,
      lineGap,
    );
    this.writeField(
      doc,
      'Condition at acceptance',
      receiptData.acceptance.conditionAtAcceptance,
      lineGap,
    );
    this.writeField(
      doc,
      'Included items',
      receiptData.acceptance.includedItems,
      lineGap,
    );
    doc.moveDown(0.7);

    this.writeSectionTitle(doc, 'Estimate');
    this.writeField(
      doc,
      'Estimated price',
      receiptData.estimate.estimatedPrice,
      lineGap,
    );
    this.writeField(
      doc,
      'Estimated ready at',
      receiptData.estimate.estimatedReadyAt,
      lineGap,
    );
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

  /**
   * Write an acceptance act PDF to disk.
   */
  private saveActPdfToDisk(orderId: string, actData: any) {
    const documentsDir = path.join(process.cwd(), 'uploads', 'documents');
    if (!fs.existsSync(documentsDir)) {
      fs.mkdirSync(documentsDir, { recursive: true });
    }
    const fileName = `act-${orderId}-${Date.now()}.pdf`;
    const absolutePath = path.join(documentsDir, fileName);
    const doc = new PDFDocument({
      size: 'A4',
      margin: 50,
    });
    const stream = fs.createWriteStream(absolutePath);
    doc.pipe(stream);

    const lineGap = 6;

    // Unified header: service center details and document title
    this.writeHeader(doc, 'Acceptance Act', actData.serviceCenter);

    this.writeSectionTitle(doc, 'Order');
    this.writeField(doc, 'Order number', actData.order.number, lineGap);
    this.writeField(doc, 'Status', actData.order.status, lineGap);
    this.writeField(
      doc,
      'Created at',
      this.formatValue(actData.order.createdAt),
      lineGap,
    );
    doc.moveDown(0.7);

    this.writeSectionTitle(doc, 'Client');
    this.writeField(doc, 'Full name', actData.client.fullName, lineGap);
    this.writeField(doc, 'Phone', actData.client.phone, lineGap);
    this.writeField(doc, 'Extra phone', actData.client.phoneExtra, lineGap);
    doc.moveDown(0.7);

    this.writeSectionTitle(doc, 'Device');
    this.writeField(doc, 'Type', actData.device.type, lineGap);
    this.writeField(doc, 'Brand', actData.device.brand, lineGap);
    this.writeField(doc, 'Model', actData.device.model, lineGap);
    this.writeField(
      doc,
      'Modification',
      actData.device.modification,
      lineGap,
    );
    this.writeField(doc, 'Color', actData.device.color, lineGap);
    this.writeField(doc, 'IMEI', actData.device.imei, lineGap);
    this.writeField(
      doc,
      'Serial number',
      actData.device.serialNumber,
      lineGap,
    );
    doc.moveDown(0.7);

    this.writeSectionTitle(doc, 'Acceptance');
    this.writeField(
      doc,
      'Issue description',
      actData.acceptance.issueDescription,
      lineGap,
    );
    this.writeField(
      doc,
      'Condition at acceptance',
      actData.acceptance.conditionAtAcceptance,
      lineGap,
    );
    this.writeField(
      doc,
      'Included items',
      actData.acceptance.includedItems,
      lineGap,
    );
    doc.moveDown(0.7);

    this.writeSectionTitle(doc, 'Estimate');
    this.writeField(
      doc,
      'Estimated price',
      actData.estimate.estimatedPrice,
      lineGap,
    );
    this.writeField(
      doc,
      'Estimated ready at',
      actData.estimate.estimatedReadyAt,
      lineGap,
    );
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

  /**
   * Write a warranty certificate PDF to disk.
   */
  private saveWarrantyPdfToDisk(orderId: string, warrantyData: any) {
    const documentsDir = path.join(process.cwd(), 'uploads', 'documents');
    if (!fs.existsSync(documentsDir)) {
      fs.mkdirSync(documentsDir, { recursive: true });
    }
    const fileName = `warranty-${orderId}-${Date.now()}.pdf`;
    const absolutePath = path.join(documentsDir, fileName);
    const doc = new PDFDocument({
      size: 'A4',
      margin: 50,
    });
    const stream = fs.createWriteStream(absolutePath);
    doc.pipe(stream);

    const lineGap = 6;

    // Unified header: service center details and document title
    this.writeHeader(doc, 'Warranty Certificate', warrantyData.serviceCenter);

    this.writeSectionTitle(doc, 'Order');
    this.writeField(
      doc,
      'Order number',
      warrantyData.order.number,
      lineGap,
    );
    this.writeField(doc, 'Status', warrantyData.order.status, lineGap);
    this.writeField(
      doc,
      'Created at',
      this.formatValue(warrantyData.order.createdAt),
      lineGap,
    );
    doc.moveDown(0.7);

    this.writeSectionTitle(doc, 'Client');
    this.writeField(
      doc,
      'Full name',
      warrantyData.client.fullName,
      lineGap,
    );
    this.writeField(doc, 'Phone', warrantyData.client.phone, lineGap);
    this.writeField(
      doc,
      'Extra phone',
      warrantyData.client.phoneExtra,
      lineGap,
    );
    doc.moveDown(0.7);

    this.writeSectionTitle(doc, 'Device');
    this.writeField(doc, 'Type', warrantyData.device.type, lineGap);
    this.writeField(doc, 'Brand', warrantyData.device.brand, lineGap);
    this.writeField(doc, 'Model', warrantyData.device.model, lineGap);
    this.writeField(
      doc,
      'Modification',
      warrantyData.device.modification,
      lineGap,
    );
    this.writeField(doc, 'Color', warrantyData.device.color, lineGap);
    this.writeField(doc, 'IMEI', warrantyData.device.imei, lineGap);
    this.writeField(
      doc,
      'Serial number',
      warrantyData.device.serialNumber,
      lineGap,
    );
    doc.moveDown(0.7);

    this.writeSectionTitle(doc, 'Acceptance');
    this.writeField(
      doc,
      'Issue description',
      warrantyData.acceptance.issueDescription,
      lineGap,
    );
    this.writeField(
      doc,
      'Condition at acceptance',
      warrantyData.acceptance.conditionAtAcceptance,
      lineGap,
    );
    this.writeField(
      doc,
      'Included items',
      warrantyData.acceptance.includedItems,
      lineGap,
    );
    doc.moveDown(0.7);

    this.writeSectionTitle(doc, 'Estimate');
    this.writeField(
      doc,
      'Estimated price',
      warrantyData.estimate.estimatedPrice,
      lineGap,
    );
    this.writeField(
      doc,
      'Estimated ready at',
      warrantyData.estimate.estimatedReadyAt,
      lineGap,
    );
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

  /**
   * Write the common header for all document types. The header includes
   * the service center name and optional contact details, followed by
   * the document title. Contact details are aligned to the left.
   */
  private writeHeader(
    doc: PDFKit.PDFDocument,
    docTitle: string,
    serviceCenter: { name: string; phone?: string; address?: string; email?: string },
  ) {
    // Service center name
    doc.fontSize(18).text(serviceCenter.name, { align: 'left' });
    // Optional contact details below the name
    if (serviceCenter.address) {
      doc.fontSize(10).text(`Address: ${serviceCenter.address}`, { align: 'left' });
    }
    if (serviceCenter.phone) {
      doc.fontSize(10).text(`Phone: ${serviceCenter.phone}`, { align: 'left' });
    }
    if (serviceCenter.email) {
      doc.fontSize(10).text(`Email: ${serviceCenter.email}`, { align: 'left' });
    }
    doc.moveDown(0.5);
    // Document title centered
    doc.fontSize(16).text(docTitle, { align: 'center' });
    doc.moveDown(1);
  }

  /**
   * Write a section title to the PDF document.
   */
  private writeSectionTitle(doc: PDFKit.PDFDocument, title: string) {
    doc.fontSize(14).text(title);
    doc.moveDown(0.3);
  }

  /**
   * Write a field with a label and value to the PDF document.
   */
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

  /**
   * Format values for display in PDF fields.
   */
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