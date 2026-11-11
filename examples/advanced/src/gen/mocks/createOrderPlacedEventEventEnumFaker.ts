import type { OrderPlacedEventEventEnumKey } from '../models/ts/OrderPlacedEventEventEnum'
import { fakerEN as faker } from '@faker-js/faker'

export function createOrderPlacedEventEventEnumFaker(data?: OrderPlacedEventEventEnumKey): OrderPlacedEventEventEnumKey {
  return data ?? faker.helpers.arrayElement(['order_placed'] as Array<OrderPlacedEventEventEnumKey>)
}
