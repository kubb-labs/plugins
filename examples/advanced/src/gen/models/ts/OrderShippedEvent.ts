import type { Order } from './Order'
import type { OrderShippedEventEventEnumKey } from './OrderShippedEventEventEnum'

export type OrderShippedEvent = {
  event: OrderShippedEventEventEnumKey
  data: Order
  id?: string
  /**
   * @minimum 0
   * @type integer | undefined
   */
  retry?: number
}
