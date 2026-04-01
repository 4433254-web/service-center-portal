import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { LocationsService } from './locations.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('locations')
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Post()
  @Roles('admin')
  create(@Body() body: any, @CurrentUser() user: any) {
    return this.locationsService.create(body, user);
  }

  @Get()
  @Roles('admin', 'receiver', 'manager', 'master')
  findAll(@CurrentUser() user: any) {
    return this.locationsService.findAll(user);
  }

  @Get(':id')
  @Roles('admin', 'receiver', 'manager', 'master')
  findOne(@Param('id') id: string) {
    return this.locationsService.findOne(id);
  }

  @Patch(':id')
  @Roles('admin', 'manager')
  update(@Param('id') id: string, @Body() body: any) {
    return this.locationsService.update(id, body);
  }

  @Post(':id/users')
  @Roles('admin', 'manager')
  addUser(@Param('id') id: string, @Body('userId') userId: string) {
    return this.locationsService.addUser(id, userId);
  }

  @Delete(':id/users/:userId')
  @Roles('admin', 'manager')
  removeUser(@Param('id') id: string, @Param('userId') userId: string) {
    return this.locationsService.removeUser(id, userId);
  }

  @Get(':id/users')
  @Roles('admin', 'manager', 'receiver')
  getUsers(@Param('id') id: string) {
    return this.locationsService.getUsersByLocation(id);
  }
}
