export class OrderResponseMapper {
  static toResponse(order: any) {
    return {
      id: order.id,
      order_number: order.number,
      status: order.status,
      created_at: order.createdAt,
      updated_at: order.updatedAt,
      client: order.client
        ? {
            id: order.client.id,
            full_name: order.client.fullName,
            phone: order.client.phone,
          }
        : null,
      device: order.device
        ? {
            id: order.device.id,
            label: `${order.device.brand} ${order.device.model}`,
          }
        : null,
    };
  }
}
