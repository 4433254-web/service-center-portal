import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @Roles('admin', 'receiver')
  create(@Body() body: any, @CurrentUser() user: any) {
    return this.ordersService.create(body, user);
  }

  @Get()
  @Roles('admin', 'receiver', 'manager', 'master')
  findAll(@CurrentUser() user: any) {
    return this.ordersService.findAll(user);
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

  @Get(':id/files')
  @Roles('admin', 'receiver', 'manager', 'master')
  getFiles(@Param('id') id: string) {
    return this.ordersService.getFiles(id);
  }

  @Get(':id/documents')
  @Roles('admin', 'receiver', 'manager', 'master')
  getDocuments(@Param('id') id: string, @CurrentUser() user: any) {
    return this.ordersService.getDocuments(id, user);
  }
}