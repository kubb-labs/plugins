import type { ApiResponse } from '../models/ts/ApiResponse.ts'
import { faker } from '@faker-js/faker'

export function createApiResponseFaker<TData extends Partial<ApiResponse> = object>(data?: TData) {
  const defaultFakeData = { code: faker.number.int(), type: faker.string.alpha(), message: faker.string.alpha() }
  return {
    ...defaultFakeData,
    ...(data || {}),
  } as Omit<typeof defaultFakeData, keyof TData> & TData
}
