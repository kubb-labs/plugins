import type { CustomerParamsStatusEnumKey } from '../models/ts/CustomerParamsStatusEnum.ts'
import { fakerEN as faker } from '@faker-js/faker'

/**
 * @description Order Status
 */
export function createCustomerParamsStatusEnumFaker(data?: CustomerParamsStatusEnumKey): CustomerParamsStatusEnumKey {
  return data ?? faker.helpers.arrayElement<CustomerParamsStatusEnumKey>(['placed', 'approved', 'delivered'])
}
