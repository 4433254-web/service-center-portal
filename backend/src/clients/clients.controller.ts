import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Post()
  @Roles('admin','receiver')
  create(@Body() body: any, @CurrentUser() user: any) {
    return this.clientsService.create(body, user);
  }

  @Get()
  @Roles('admin','receiver','manager','master')
  findAll(@Query('search') search: string, @CurrentUser() user: any) {
    return this.clientsService.findAll(search, user);
  }

  @Patch(':id')
  @Roles('admin','receiver')
  update(@Param('id') id: string, @Body() body: any, @CurrentUser() user: any) {
    return this.clientsService.update(id, body, user);
  }

  @Delete(':id')
  @Roles('admin','receiver')
  remove(@Param('id') id: string) {
    return this.clientsService.remove(id);
  }
}
