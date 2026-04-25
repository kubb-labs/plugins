import type { ApiResponse } from '../models/ts/ApiResponse.ts'
import { faker } from '@faker-js/faker'

export function apiResponseFaker(data?: Partial<ApiResponse>): Required<ApiResponse> {
  const defaultFakeData = { code: faker.number.int(), type: faker.string.alpha(), message: faker.string.alpha() }
  return {
    ...defaultFakeData,
    ...(data || {}),
  } as Required<ApiResponse>
}
