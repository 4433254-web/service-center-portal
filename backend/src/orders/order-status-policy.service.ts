import { ForbiddenException, Injectable } from '@nestjs/common';
import { OrderStatus } from '../common/enums/order-status.enum';

@Injectable()
export class OrderStatusPolicyService {
  validateRole(roles: string[], next: OrderStatus) {
    if (roles.includes('admin')) {
      return true;
    }

    if (roles.includes('manager')) {
      throw new ForbiddenException('Manager cannot change status');
    }

    if (roles.includes('receiver')) {
      if (next === OrderStatus.READY) {
        throw new ForbiddenException('Receiver cannot set READY');
      }
      return true;
    }

    if (roles.includes('master')) {
      if (next === OrderStatus.ISSUED) {
        throw new ForbiddenException('Master cannot issue order');
      }
      return true;
    }

    throw new ForbiddenException('No permission to change status');
  }
}