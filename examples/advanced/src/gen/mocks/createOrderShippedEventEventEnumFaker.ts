import type { OrderShippedEventEventEnumKey } from '../models/ts/OrderShippedEventEventEnum'
import { fakerEN as faker } from '@faker-js/faker'

export function createOrderShippedEventEventEnumFaker(data?: OrderShippedEventEventEnumKey): OrderShippedEventEventEnumKey {
  return data ?? faker.helpers.arrayElement<OrderShippedEventEventEnumKey>(['order_shipped'])
}
