import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { OrderStatusPolicyService } from './order-status-policy.service';
import { OrderPartsService } from './order-parts.service';
import { OrderPartsController } from './order-parts.controller';
import { DocumentsModule } from '../documents/documents.module';

@Module({
  imports: [DocumentsModule],
  providers: [OrdersService, OrderStatusPolicyService, OrderPartsService],
  controllers: [OrdersController, OrderPartsController],
  exports: [OrdersService],
})
export class OrdersModule {}
