import { OrderStatus } from '../common/enums/order-status.enum';

export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.ACCEPTED]: [OrderStatus.IN_DIAGNOSTICS, OrderStatus.CANCELLED],
  [OrderStatus.IN_DIAGNOSTICS]: [
    OrderStatus.WAITING_APPROVAL,
    OrderStatus.IN_PROGRESS,
    OrderStatus.CANCELLED,
  ],
  [OrderStatus.WAITING_APPROVAL]: [
    OrderStatus.IN_PROGRESS,
    OrderStatus.CANCELLED,
  ],
  [OrderStatus.IN_PROGRESS]: [OrderStatus.READY],
  [OrderStatus.READY]: [OrderStatus.ISSUED],
  [OrderStatus.ISSUED]: [],
  [OrderStatus.CANCELLED]: [],
};