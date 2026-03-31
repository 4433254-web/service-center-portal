import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { OrderStatusPolicyService } from './order-status-policy.service';
import { DocumentsModule } from '../documents/documents.module';

@Module({
  imports: [DocumentsModule],
  providers: [OrdersService, OrderStatusPolicyService],
  controllers: [OrdersController],
  exports: [OrdersService],
})
export class OrdersModule {}
