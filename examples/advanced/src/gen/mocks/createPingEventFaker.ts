import type { PingEvent } from '../models/ts/PingEvent'
import { createPingEventEventEnumFaker } from './createPingEventEventEnumFaker'
import { fakerEN as faker } from '@faker-js/faker'

export function createPingEventFaker<TData extends Partial<PingEvent> = object>(data?: TData) {
  const defaultFakeData = {
    event: createPingEventEventEnumFaker(),
    data: faker.string.alpha(),
  }
  return {
    ...defaultFakeData,
    ...(data || {}),
  } as Omit<typeof defaultFakeData, keyof NoInfer<TData>> & NoInfer<TData>
}
