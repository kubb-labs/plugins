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
          event: faker.helpers.arrayElement<(NonNullable<Extract<NonNullable<OrderEvent>, { event: 'order_placed' }>> & Record<'event', unknown>)['event']>([
            'order_placed',
          ]),
        },
      },
      {
        ...createOrderShippedEventFaker(),
        ...{
          event: faker.helpers.arrayElement<(NonNullable<Extract<NonNullable<OrderEvent>, { event: 'order_shipped' }>> & Record<'event', unknown>)['event']>([
            'order_shipped',
          ]),
        },
      },
      {
        ...createPingEventFaker(),
        ...{
          event: faker.helpers.arrayElement<(NonNullable<Extract<NonNullable<OrderEvent>, { event: 'ping' }>> & Record<'event', unknown>)['event']>(['ping']),
        },
      },
    ])) as OrderEvent
}
