import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { OrderStatusPolicyService } from './order-status-policy.service';

@Module({
  providers: [OrdersService, OrderStatusPolicyService],
  controllers: [OrdersController],
  exports: [OrdersService],
})
export class OrdersModule {}
