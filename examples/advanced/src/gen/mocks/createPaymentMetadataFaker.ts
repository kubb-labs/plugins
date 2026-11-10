import type { PaymentMetadata } from '../models/ts/PaymentMetadata'
import { fakerEN as faker } from '@faker-js/faker'

export function createPaymentMetadataFaker<TData extends Partial<PaymentMetadata> = object>(data?: TData) {
  const defaultFakeData = {
    source: faker.string.alpha(),
  }
  return {
    ...defaultFakeData,
    ...(data || {}),
  } as Omit<typeof defaultFakeData, keyof NoInfer<TData>> & NoInfer<TData>
}
