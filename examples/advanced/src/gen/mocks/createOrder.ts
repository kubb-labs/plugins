import type { Order } from '../models/ts/Order.ts'
import { createOrderHttpStatusEnumFaker } from './createOrderHttpStatusEnum.ts'
import { createOrderOrderTypeEnumFaker } from './createOrderOrderTypeEnum.ts'
import { createOrderParamsStatusEnumFaker } from './createOrderParamsStatusEnum.ts'
import { createOrderStatusEnumFaker } from './createOrderStatusEnum.ts'
import { fakerEN as faker } from '@faker-js/faker'

export function createOrderFaker<TData extends Partial<Order> = object>(data?: TData) {
  const defaultFakeData = {
    id: faker.number.int(),
    petId: faker.number.int(),
    params: {
      status: createOrderParamsStatusEnumFaker(),
      type: faker.string.alpha(),
    },
    quantity: faker.number.int(),
    orderType: createOrderOrderTypeEnumFaker(),
    type: faker.string.alpha(),
    shipDate: faker.date.anytime().toISOString(),
    status: createOrderStatusEnumFaker(),
    http_status: createOrderHttpStatusEnumFaker(),
    complete: faker.datatype.boolean(),
  }
  return {
    ...defaultFakeData,
    ...(data || {}),
  } as Omit<typeof defaultFakeData, keyof TData> & TData
}
