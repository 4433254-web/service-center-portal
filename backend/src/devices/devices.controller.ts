import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { DevicesService } from './devices.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('devices')
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @Post()
  @Roles('admin','receiver')
  create(@Body() body: any, @CurrentUser() user: any) {
    return this.devicesService.create(body, user);
  }

  @Get()
  @Roles('admin','receiver','manager','master')
  findAll(@Query('search') search: string, @CurrentUser() user: any) {
    return this.devicesService.findAll(search, user);
  }

  @Patch(':id')
  @Roles('admin','receiver')
  update(@Param('id') id: string, @Body() body: any, @CurrentUser() user: any) {
    return this.devicesService.update(id, body, user);
  }

  @Delete(':id')
  @Roles('admin','receiver')
  remove(@Param('id') id: string) {
    return this.devicesService.remove(id);
  }
}
