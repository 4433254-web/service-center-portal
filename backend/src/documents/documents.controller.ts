import { Controller, Get, Param, Post, Res } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Response } from 'express';

@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Get(':id')
  @Roles('admin', 'receiver', 'manager', 'master')
  getOne(@Param('id') id: string) {
    return this.documentsService.getDocument(id);
  }

  @Get(':id/view')
  @Roles('admin', 'receiver', 'manager', 'master')
  async view(@Param('id') id: string, @Res() res: Response) {
    const { html } = await this.documentsService.viewDocument(id);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  }

  @Get(':id/download')
  @Roles('admin', 'receiver', 'manager', 'master')
  async download(@Param('id') id: string, @Res() res: Response) {
    const { html } = await this.documentsService.viewDocument(id);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  }
}
