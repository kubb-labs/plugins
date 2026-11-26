import type { Order } from './Order'
import type { OrderPlacedEventEventEnumKey } from './OrderPlacedEventEventEnum'

export type OrderPlacedEvent = {
  event: OrderPlacedEventEventEnumKey
  data: Order
  id?: string
  /**
   * @minimum 0
   */
  retry?: number
}
