import type { OrderHttpStatusEnumKey } from '../models/ts/OrderHttpStatusEnum'
import { fakerEN as faker } from '@faker-js/faker'

/**
 * @description HTTP Status
 */
export function createOrderHttpStatusEnumFaker(data?: OrderHttpStatusEnumKey): OrderHttpStatusEnumKey {
  return data ?? faker.helpers.arrayElement([200, 400, 500] as Array<OrderHttpStatusEnumKey>)
}
