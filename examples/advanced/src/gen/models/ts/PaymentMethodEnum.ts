export const paymentMethodEnum = {
  card: 'card',
  cash: 'cash',
} as const

export type PaymentMethodEnumKey = (typeof paymentMethodEnum)[keyof typeof paymentMethodEnum]
