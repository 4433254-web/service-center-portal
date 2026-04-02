import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { OrderPartsService } from './order-parts.service';

@Controller('orders')
export class OrderPartsController {
  constructor(private readonly partsService: OrderPartsService) {}

  @Get(':id/parts')
  @Roles('admin', 'receiver', 'master', 'manager')
  getParts(@Param('id') id: string) {
    return this.partsService.getByOrder(id);
  }

  @Post(':id/parts')
  @Roles('admin', 'receiver', 'master')
  addPart(@Param('id') id: string, @Body() body: any, @CurrentUser() user: any) {
    return this.partsService.addPart(id, body, user);
  }

  @Patch(':id/parts/:partId')
  @Roles('admin', 'receiver', 'master')
  updatePart(@Param('partId') partId: string, @Body() body: any) {
    return this.partsService.updatePart(partId, body);
  }

  @Delete(':id/parts/:partId')
  @Roles('admin', 'receiver', 'master')
  deletePart(@Param('partId') partId: string) {
    return this.partsService.deletePart(partId);
  }

  @Patch(':id/price')
  @Roles('admin', 'receiver', 'master')
  updatePrice(@Param('id') id: string, @Body() body: any, @CurrentUser() user: any) {
    return this.partsService.updateOrderPrice(id, body, user);
  }
}
