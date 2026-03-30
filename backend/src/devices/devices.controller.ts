import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { DevicesService } from './devices.service';

@Controller('devices')
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @Post()
  create(@Body() body: any) {
    return this.devicesService.create(body);
  }

  @Get()
  findAll(@Query('search') search?: string) {
    return this.devicesService.findAll(search);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.devicesService.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.devicesService.remove(id);
  }
}
