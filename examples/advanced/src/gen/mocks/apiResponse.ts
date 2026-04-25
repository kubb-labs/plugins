import type { ApiResponse } from '../models/ts/ApiResponse.ts'
import { faker } from '@faker-js/faker'

export function apiResponseFaker(data?: Partial<ApiResponse>): Required<ApiResponse> {
  return Object.assign({} as Required<ApiResponse>, { code: faker.number.int(), type: faker.string.alpha(), message: faker.string.alpha() }, data)
}
