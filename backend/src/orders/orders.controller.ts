import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { DocumentsService } from '../documents/documents.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('orders')
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly documentsService: DocumentsService,
  ) {}

  @Post()
  @Roles('admin', 'receiver')
  create(@Body() body: any, @CurrentUser() user: any) {
    return this.ordersService.create(body, user);
  }

  @Get()
  @Roles('admin', 'receiver', 'manager', 'master')
  findAll(@CurrentUser() user: any, @Query() query: any) {
    return this.ordersService.findAll(user, query);
  }

  @Get(':id')
  @Roles('admin', 'receiver', 'manager', 'master')
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.ordersService.findOne(id, user);
  }

  @Patch(':id')
  @Roles('admin', 'receiver', 'master')
  update(@Param('id') id: string, @Body() body: any, @CurrentUser() user: any) {
    return this.ordersService.update(id, body, user);
  }

  @Delete(':id')
  @Roles('admin', 'receiver')
  delete(@Param('id') id: string) {
    return this.ordersService.delete(id);
  }

  @Post(':id/status')
  @Roles('admin', 'receiver', 'master')
  changeStatus(
    @Param('id') id: string,
    @Body() body: { toStatus: string; comment?: string },
    @CurrentUser() user: any,
  ) {
    return this.ordersService.changeStatus(id, body, user);
  }

  @Get(':id/status-history')
  @Roles('admin', 'receiver', 'manager', 'master')
  getStatusHistory(@Param('id') id: string) {
    return this.ordersService.getStatusHistory(id);
  }

  @Get(':id/comments')
  @Roles('admin', 'receiver', 'manager', 'master')
  getComments(@Param('id') id: string, @CurrentUser() user: any) {
    return this.ordersService.getComments(id, user);
  }

  @Post(':id/comments')
  @Roles('admin', 'receiver', 'master')
  addComment(@Param('id') id: string, @Body() body: any, @CurrentUser() user: any) {
    return this.ordersService.addComment(id, body, user);
  }

  @Get(':id/documents')
  @Roles('admin', 'receiver', 'manager', 'master')
  getDocuments(@Param('id') id: string) {
    return this.ordersService.getDocuments(id);
  }

  @Post(':id/documents/receipt')
  @Roles('admin', 'receiver')
  generateReceipt(@Param('id') id: string, @CurrentUser() user: any) {
    return this.documentsService.generateReceipt(id, user);
  }

  @Get(':id/files')
  @Roles('admin', 'receiver', 'manager', 'master')
  getFiles(@Param('id') id: string) {
    return this.ordersService.getFiles(id);
  }
}
