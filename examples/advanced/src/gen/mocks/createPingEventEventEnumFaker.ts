import type { PingEventEventEnumKey } from '../models/ts/PingEventEventEnum'
import { fakerEN as faker } from '@faker-js/faker'

export function createPingEventEventEnumFaker(data?: PingEventEventEnumKey): PingEventEventEnumKey {
  return data ?? faker.helpers.arrayElement(['ping'] as Array<PingEventEventEnumKey>)
}
