import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { UsersService } from './users.service';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('users')
@Roles('admin')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() body: { login: string; password: string; roles?: string[]; isActive?: boolean }) {
    return this.usersService.create(body);
  }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: { isActive?: boolean; roles?: string[] }) {
    return this.usersService.update(id, body);
  }

  @Post(':id/reset-password')
  resetPassword(@Param('id') id: string, @Body() body: { password: string }) {
    return this.usersService.resetPassword(id, body.password);
  }
}
