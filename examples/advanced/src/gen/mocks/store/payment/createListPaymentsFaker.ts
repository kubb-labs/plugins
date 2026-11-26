import type { Payment } from '../../../models/ts/Payment'
import type { PaymentError } from '../../../models/ts/PaymentError'
import { createPaymentErrorFaker } from '../../createPaymentErrorFaker'
import { createPaymentFaker } from '../../createPaymentFaker'
import { fakerEN as faker } from '@faker-js/faker'

type ListPaymentsStatus2xx = Array<Payment>

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
export function createListPaymentsStatus2xxFaker(data?: Partial<ListPaymentsStatus2xx>): ListPaymentsStatus2xx {
  return [...faker.helpers.multiple(() => createPaymentFaker()), ...(data || []).filter((item) => item !== undefined)] as ListPaymentsStatus2xx
}

/**
 * @description Client error
 */
export function createListPaymentsStatus4xxFaker(data?: Partial<PaymentError>): PaymentError {
  return createPaymentErrorFaker(data) as PaymentError
}

export function createListPaymentsResponseFaker(data?: Partial<ListPaymentsStatus2xx>): ListPaymentsStatus2xx {
  return [...faker.helpers.multiple(() => createPaymentFaker()), ...(data || []).filter((item) => item !== undefined)] as ListPaymentsStatus2xx
}
