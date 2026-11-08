import type { OrderEvent } from '../../models/ts/OrderEvent'
import { createOrderEventFaker } from '../createOrderEventFaker'
import { fakerEN as faker } from '@faker-js/faker'

export function createStreamOrderEventsPathFaker<
  TData extends Partial<{
    orderId: number
  }> = object,
>(data?: TData) {
  const defaultFakeData = {
    orderId: faker.number.int(),
  }
  return {
    ...defaultFakeData,
    ...(data || {}),
  } as Omit<typeof defaultFakeData, keyof NoInfer<TData>> & NoInfer<TData>
}

/**
 * @description Server-Sent Events stream of order updates
 */
export function createStreamOrderEventsStatus200Faker(data?: Partial<OrderEvent>): OrderEvent {
  return createOrderEventFaker(data) as OrderEvent
}

export function createStreamOrderEventsResponseFaker(data?: Partial<OrderEvent>): OrderEvent {
  return createStreamOrderEventsStatus200Faker(data) as OrderEvent
}
