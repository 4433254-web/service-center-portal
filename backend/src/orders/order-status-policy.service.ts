import { Injectable, ForbiddenException } from '@nestjs/common';
import { OrderStatus } from '../common/enums/order-status.enum';

@Injectable()
export class OrderStatusPolicyService {
  canChange(current: OrderStatus, next: OrderStatus, roles: string[]) {
    if (roles.includes('manager')) {
      throw new ForbiddenException('Manager cannot change status');
    }

    if (roles.includes('receiver') && next === OrderStatus.READY) {
      throw new ForbiddenException('Receiver cannot set READY');
    }

    if (roles.includes('master') && next === OrderStatus.ISSUED) {
      throw new ForbiddenException('Master cannot issue order');
    }

    return true;
  }
}
