import type { Payment } from '../../../models/ts/Payment'
import { createPaymentFaker } from '../../createPaymentFaker'
import { fakerEN as faker } from '@faker-js/faker'

export function createGetPaymentByIdPathFaker<
  TData extends Partial<{
    paymentId: number
  }> = object,
>(data?: TData) {
  const defaultFakeData = {
    paymentId: faker.number.int(),
  }
  return {
    ...defaultFakeData,
    ...(data || {}),
  } as Omit<typeof defaultFakeData, keyof NoInfer<TData>> & NoInfer<TData>
}

/**
 * @description The payment
 */
export function createGetPaymentByIdStatus200Faker(data?: Partial<Payment>): Payment {
  return createPaymentFaker(data) as Payment
}

export function createGetPaymentByIdResponseFaker(data?: Partial<Payment>): Payment {
  return createGetPaymentByIdStatus200Faker(data) as Payment
}
