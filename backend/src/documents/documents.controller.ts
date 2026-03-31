import {
  Controller,
  Get,
  Param,
  Post,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { DocumentsService } from './documents.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';

@Controller()
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  /**
   * Generate a receipt for the specified order.
   * Only admins and receivers are allowed to create receipts.
   */
  @Post('orders/:id/documents/receipt')
  @Roles('admin', 'receiver')
  generateReceipt(@Param('id') orderId: string, @CurrentUser() user: any) {
    return this.documentsService.generateReceipt(orderId, user);
  }

  /**
   * Generate an acceptance act for the specified order.
   * Only admins and receivers are allowed to create acts.
   */
  @Post('orders/:id/documents/act')
  @Roles('admin', 'receiver')
  generateAct(@Param('id') orderId: string, @CurrentUser() user: any) {
    return this.documentsService.generateAct(orderId, user);
  }

  /**
   * Generate a warranty certificate for the specified order.
   * Only admins and receivers are allowed to create warranty certificates.
   */
  @Post('orders/:id/documents/warranty')
  @Roles('admin', 'receiver')
  generateWarranty(@Param('id') orderId: string, @CurrentUser() user: any) {
    return this.documentsService.generateWarranty(orderId, user);
  }

  /**
   * List all documents for the specified order.
   * All roles except guests can view document lists. Masters only see their own orders.
   */
  @Get('orders/:id/documents')
  @Roles('admin', 'receiver', 'manager', 'master')
  getDocuments(@Param('id') orderId: string, @CurrentUser() user: any) {
    return this.documentsService.getDocumentsByOrder(orderId, user);
  }

  /**
   * Get a single document's metadata.
   */
  @Get('documents/:id')
  @Roles('admin', 'receiver', 'manager', 'master')
  getOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.documentsService.getOne(id, user);
  }

  /**
   * Retrieve document info for download. Mirrors getOne for consistency.
   */
  @Get('documents/:id/download-info')
  @Roles('admin', 'receiver', 'manager', 'master')
  getDownloadInfo(@Param('id') id: string, @CurrentUser() user: any) {
    return this.documentsService.getOne(id, user);
  }

  /**
   * Download the actual file for a document.
   */
  @Get('documents/:id/download')
  @Roles('admin', 'receiver', 'manager', 'master')
  async download(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Res() res: Response,
  ) {
    const file = await this.documentsService.getDownloadFile(id, user);
    return res.download(file.storageKey, file.fileName);
  }
}