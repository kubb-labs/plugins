import type { OrderPlacedEvent } from './OrderPlacedEvent'
import type { OrderShippedEvent } from './OrderShippedEvent'
import type { PingEvent } from './PingEvent'

export type OrderEvent =
  | (OrderPlacedEvent & {
      event: 'order_placed'
    })
  | (OrderShippedEvent & {
      event: 'order_shipped'
    })
  | (PingEvent & {
      event: 'ping'
    })
