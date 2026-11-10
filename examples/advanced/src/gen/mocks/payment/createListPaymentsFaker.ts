import type { Payment } from '../../models/ts/Payment'
import type { PaymentError } from '../../models/ts/PaymentError'
import { createPaymentErrorFaker } from '../createPaymentErrorFaker'
import { createPaymentFaker } from '../createPaymentFaker'
import { fakerEN as faker } from '@faker-js/faker'

export function createListPaymentsQueryFaker<
  TData extends Partial<{
    status?: string
    filter?: string
  }> = object,
>(data?: TData) {
  const defaultFakeData = {
    status: faker.string.alpha(),
    filter: faker.string.alpha(),
  }
  return {
    ...defaultFakeData,
    ...(data || {}),
  } as Omit<typeof defaultFakeData, keyof NoInfer<TData>> & NoInfer<TData>
}

export function createListPaymentsCookiesFaker<
  TData extends Partial<{
    session?: string
  }> = object,
>(data?: TData) {
  const defaultFakeData = {
    session: faker.string.alpha(),
  }
  return {
    ...defaultFakeData,
    ...(data || {}),
  } as Omit<typeof defaultFakeData, keyof NoInfer<TData>> & NoInfer<TData>
}

/**
 * @description The payments
 */
export function createListPaymentsStatus2XXFaker(data?: Partial<Array<Payment>>): Array<Payment> {
  return [...faker.helpers.multiple(() => createPaymentFaker()), ...(data || []).filter((item) => item !== undefined)] as Array<Payment>
}

/**
 * @description Client error
 */
export function createListPaymentsStatus4XXFaker(data?: Partial<PaymentError>): PaymentError {
  return createPaymentErrorFaker(data) as PaymentError
}

export function createListPaymentsResponseFaker(data?: Partial<Array<Payment>>): Array<Payment> {
  return (data ?? faker.helpers.arrayElement([createListPaymentsStatus2XXFaker(), createListPaymentsStatus4XXFaker()])) as Array<Payment>
}
