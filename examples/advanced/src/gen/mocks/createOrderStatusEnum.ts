import type { OrderStatusEnumKey } from '../models/ts/OrderStatusEnum.ts'
import { fakerEN as faker } from '@faker-js/faker'

/**
 * @description Order Status
 */
export function createOrderStatusEnum(data?: OrderStatusEnumKey): OrderStatusEnumKey {
  return data ?? faker.helpers.arrayElement<OrderStatusEnumKey>(['placed', 'approved', 'delivered'])
}
