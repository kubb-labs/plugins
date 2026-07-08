import type { OrderParamsStatusEnumKey } from '../models/ts/OrderParamsStatusEnum.ts'
import { fakerEN as faker } from '@faker-js/faker'

/**
 * @description Order Status
 */
export function createOrderParamsStatusEnumFaker(data?: OrderParamsStatusEnumKey): OrderParamsStatusEnumKey {
  return data ?? faker.helpers.arrayElement<OrderParamsStatusEnumKey>(['placed', 'approved', 'delivered'])
}
