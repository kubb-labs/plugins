import type { PaymentError } from '../models/ts/PaymentError'
import { fakerEN as faker } from '@faker-js/faker'

export function createPaymentErrorFaker<TData extends Partial<PaymentError> = object>(data?: TData) {
  const defaultFakeData = {
    message: faker.string.alpha(),
  }
  return {
    ...defaultFakeData,
    ...(data || {}),
  } as Omit<typeof defaultFakeData, keyof NoInfer<TData>> & NoInfer<TData>
}
