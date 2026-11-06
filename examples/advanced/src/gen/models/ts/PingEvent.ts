import type { PingEventEventEnumKey } from './PingEventEventEnum'

export type PingEvent = {
  event: PingEventEventEnumKey
  data?: string
}
