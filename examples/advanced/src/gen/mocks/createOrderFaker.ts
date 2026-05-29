import type { Order } from '../models/ts/Order.ts'
import { createOrderParamsFaker } from './createOrderParamsFaker.ts'
import { fakerEN as faker } from '@faker-js/faker'

export function createOrderFaker<TData extends Partial<Order> = object>(data?: TData) {
  const defaultFakeData = {
    id: faker.number.int(),
    petId: faker.number.int(),
    params: createOrderParamsFaker(),
    quantity: faker.number.int(),
    orderType: faker.helpers.arrayElement<NonNullable<Order>['orderType']>(['foo', 'bar']),
    type: faker.string.alpha(),
    shipDate: faker.date.anytime().toISOString(),
    status: faker.helpers.arrayElement<any>(['working', 'idle']),
    http_status: faker.helpers.arrayElement<NonNullable<Order>['http_status']>([200, 400, 500]),
    complete: faker.datatype.boolean(),
  }
  return {
    ...defaultFakeData,
    ...(data || {}),
  } as Omit<typeof defaultFakeData, keyof TData> & TData
}
