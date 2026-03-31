import { Controller, Get, Param, Post, Res } from '@nestjs/common';
import { Response } from 'express';
import { DocumentsService } from './documents.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';

@Controller()
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post('orders/:id/documents/receipt')
  @Roles('admin', 'receiver')
  generateReceipt(
    @Param('id') orderId: string,
    @CurrentUser() user: any,
  ) {
    return this.documentsService.generateReceipt(orderId, user);
  }

  @Get('documents/:id')
  @Roles('admin', 'receiver', 'manager', 'master')
  getOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.documentsService.getOne(id, user);
  }

  @Get('documents/:id/download-info')
  @Roles('admin', 'receiver', 'manager', 'master')
  getDownloadInfo(@Param('id') id: string, @CurrentUser() user: any) {
    return this.documentsService.getOne(id, user);
  }

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