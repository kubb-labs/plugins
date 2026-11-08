import type { OrderShippedEvent } from '../models/ts/OrderShippedEvent'
import { createOrderFaker } from './createOrderFaker'
import { createOrderShippedEventEventEnumFaker } from './createOrderShippedEventEventEnumFaker'
import { fakerEN as faker } from '@faker-js/faker'

export function createOrderShippedEventFaker<TData extends Partial<OrderShippedEvent> = object>(data?: TData) {
  const defaultFakeData = {
    event: createOrderShippedEventEventEnumFaker(),
    data: createOrderFaker(),
    id: faker.string.alpha(),
    retry: faker.number.int({ min: 0 }),
  }
  return {
    ...defaultFakeData,
    ...(data || {}),
  } as Omit<typeof defaultFakeData, keyof NoInfer<TData>> & NoInfer<TData>
}
