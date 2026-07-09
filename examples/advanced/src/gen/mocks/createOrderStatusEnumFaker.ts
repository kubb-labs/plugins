import type { OrderStatusEnumKey } from '../models/ts/OrderStatusEnum'
import { fakerEN as faker } from '@faker-js/faker'

/**
 * @description Order Status
 */
export function createOrderStatusEnumFaker(data?: OrderStatusEnumKey): OrderStatusEnumKey {
  return data ?? faker.helpers.arrayElement<OrderStatusEnumKey>(['placed', 'approved', 'delivered'])
}
