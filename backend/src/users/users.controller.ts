import { Body, Controller, Get, Post } from '@nestjs/common';
import { UsersService } from './users.service';
import { Public } from '../common/decorators/public.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Create a new user. This endpoint is marked as public so that a
   * bootstrap user can be created without authentication. In
   * production, remove the `@Public()` decorator and protect it
   * appropriately with JWT and role guards.
   */
  @Public()
  @Post()
  create(@Body() body: { login: string; password: string }) {
    return this.usersService.create(body);
  }

  /**
   * List all users. Public for initial development.
   */
  @Public()
  @Get()
  findAll() {
    return this.usersService.findAll();
  }
}