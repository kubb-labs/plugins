import type { OrderEvent } from '../models/ts/OrderEvent'
import { createOrderPlacedEventFaker } from './createOrderPlacedEventFaker'
import { createOrderShippedEventFaker } from './createOrderShippedEventFaker'
import { createPingEventFaker } from './createPingEventFaker'
import { fakerEN as faker } from '@faker-js/faker'

export function createOrderEventFaker(data?: Partial<OrderEvent>): OrderEvent {
  return (data ??
    faker.helpers.arrayElement([
      {
        ...createOrderPlacedEventFaker(),
        ...{
          event: faker.helpers.arrayElement(['order_placed'] as Array<
            (NonNullable<Extract<NonNullable<OrderEvent>, { event: 'order_placed' }>> & Record<'event', unknown>)['event']
          >),
        },
      },
      {
        ...createOrderShippedEventFaker(),
        ...{
          event: faker.helpers.arrayElement(['order_shipped'] as Array<
            (NonNullable<Extract<NonNullable<OrderEvent>, { event: 'order_shipped' }>> & Record<'event', unknown>)['event']
          >),
        },
      },
      {
        ...createPingEventFaker(),
        ...{
          event: faker.helpers.arrayElement(['ping'] as Array<
            (NonNullable<Extract<NonNullable<OrderEvent>, { event: 'ping' }>> & Record<'event', unknown>)['event']
          >),
        },
      },
    ])) as OrderEvent
}
