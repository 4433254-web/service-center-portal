import { OrderStatus } from '../common/enums/order-status.enum';

export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  // accepted → можно идти на диагностику, сразу в работу, сразу готово (мелкий ремонт) или отмена
  [OrderStatus.ACCEPTED]: [
    OrderStatus.IN_DIAGNOSTICS,
    OrderStatus.IN_PROGRESS,
    OrderStatus.READY,
    OrderStatus.CANCELLED,
  ],
  [OrderStatus.IN_DIAGNOSTICS]: [
    OrderStatus.WAITING_APPROVAL,
    OrderStatus.IN_PROGRESS,
    OrderStatus.CANCELLED,
  ],
  [OrderStatus.WAITING_APPROVAL]: [
    OrderStatus.IN_PROGRESS,
    OrderStatus.CANCELLED,
  ],
  [OrderStatus.IN_PROGRESS]: [OrderStatus.READY, OrderStatus.CANCELLED],
  [OrderStatus.READY]: [OrderStatus.ISSUED],
  [OrderStatus.ISSUED]: [],
  [OrderStatus.CANCELLED]: [],
};