import type { OrderHttpStatusEnumKey } from '../models/ts/OrderHttpStatusEnum.ts'
import { fakerEN as faker } from '@faker-js/faker'

/**
 * @description HTTP Status
 */
export function createOrderHttpStatusEnumFaker(data?: OrderHttpStatusEnumKey): OrderHttpStatusEnumKey {
  return data ?? faker.helpers.arrayElement<OrderHttpStatusEnumKey>([200, 400, 500])
}
