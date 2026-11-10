export const paymentLabel = {
  priority: 'priority',
} as const

export type PaymentLabelKey = (typeof paymentLabel)[keyof typeof paymentLabel]
