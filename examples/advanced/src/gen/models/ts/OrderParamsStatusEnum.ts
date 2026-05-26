export const orderParamsStatusEnum = {
  placed: 'placed',
  approved: 'approved',
  delivered: 'delivered',
} as const

export type OrderParamsStatusEnumKey = (typeof orderParamsStatusEnum)[keyof typeof orderParamsStatusEnum]
