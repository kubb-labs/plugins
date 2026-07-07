import type { Order } from '../models/ts/Order.ts'
import { createOrderHttpStatusEnum } from './createOrderHttpStatusEnum.ts'
import { createOrderOrderTypeEnum } from './createOrderOrderTypeEnum.ts'
import { createOrderParamsStatusEnum } from './createOrderParamsStatusEnum.ts'
import { createOrderStatusEnum } from './createOrderStatusEnum.ts'
import { fakerEN as faker } from '@faker-js/faker'

export function createOrder<TData extends Partial<Order> = object>(data?: TData) {
  const defaultFakeData = {
    id: faker.number.int(),
    petId: faker.number.int(),
    params: {
      status: createOrderParamsStatusEnum(),
      type: faker.string.alpha(),
    },
    quantity: faker.number.int(),
    orderType: createOrderOrderTypeEnum(),
    type: faker.string.alpha(),
    shipDate: faker.date.anytime().toISOString(),
    status: createOrderStatusEnum(),
    http_status: createOrderHttpStatusEnum(),
    complete: faker.datatype.boolean(),
  }
  return {
    ...defaultFakeData,
    ...(data || {}),
  } as Omit<typeof defaultFakeData, keyof TData> & TData
}
