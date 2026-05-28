import type { OrderParams } from '../models/ts/OrderParams.ts'
import { fakerEN as faker } from '@faker-js/faker'

export function createOrderParamsFaker<TData extends Partial<OrderParams> = object>(data?: TData) {
  const defaultFakeData = { status: faker.helpers.arrayElement<any>(['working', 'idle']), type: faker.string.alpha() }
  return {
    ...defaultFakeData,
    ...(data || {}),
  } as Omit<typeof defaultFakeData, keyof TData> & TData
}
