import type { OrderPlacedEvent } from '../models/ts/OrderPlacedEvent'
import { createOrderFaker } from './createOrderFaker'
import { createOrderPlacedEventEventEnumFaker } from './createOrderPlacedEventEventEnumFaker'
import { fakerEN as faker } from '@faker-js/faker'

export function createOrderPlacedEventFaker<TData extends Partial<OrderPlacedEvent> = object>(data?: TData) {
  const defaultFakeData = {
    event: createOrderPlacedEventEventEnumFaker(),
    data: createOrderFaker(),
    id: faker.string.alpha(),
    retry: faker.number.int({ min: 0 }),
  }
  return {
    ...defaultFakeData,
    ...(data || {}),
  } as Omit<typeof defaultFakeData, keyof NoInfer<TData>> & NoInfer<TData>
}
