import type { OrderOrderTypeEnumKey } from '../models/ts/OrderOrderTypeEnum.ts'
import { fakerEN as faker } from '@faker-js/faker'

export function createOrderOrderTypeEnumFaker(data?: OrderOrderTypeEnumKey): OrderOrderTypeEnumKey {
  return data ?? faker.helpers.arrayElement<OrderOrderTypeEnumKey>(['foo', 'bar'])
}
