import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { DevicesService } from './devices.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('devices')
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @Post()
  @Roles('admin', 'receiver')
  create(@Body() body: any, @CurrentUser() user: any) {
    return this.devicesService.create(body, user);
  }

  @Get()
  @Roles('admin', 'receiver', 'manager', 'master')
  findAll(@Query() query: any, @CurrentUser() user: any) {
    return this.devicesService.findAll(query, user);
  }

  @Get(':id')
  @Roles('admin', 'receiver', 'manager', 'master')
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.devicesService.findOne(id, user);
  }

  @Patch(':id')
  @Roles('admin', 'receiver')
  update(@Param('id') id: string, @Body() body: any, @CurrentUser() user: any) {
    return this.devicesService.update(id, body, user);
  }

  @Delete(':id')
  @Roles('admin', 'receiver')
  remove(@Param('id') id: string) {
    return this.devicesService.remove(id);
  }

  @Get(':id/orders')
  @Roles('admin', 'receiver', 'manager')
  getOrders(@Param('id') id: string) {
    return this.devicesService.getOrders(id);
  }
}
