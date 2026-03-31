import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { OrdersService } from './orders.service';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  create(@Body() body: any) {
    return this.ordersService.create(body);
  }

  @Get()
  findAll() {
    return this.ordersService.findAll();
  }

  @Post(':id/status')
  changeStatus(
    @Param('id') id: string,
    @Body() body: { toStatus: string; comment?: string },
  ) {
    return this.ordersService.changeStatus(id, body, {
      userId: '986c2998-21d2-40ef-a270-a590264b3e71',
      roles: ['admin'],
    });
  }

  @Get(':id/status-history')
  getStatusHistory(@Param('id') id: string) {
    return this.ordersService.getStatusHistory(id);
  }
}