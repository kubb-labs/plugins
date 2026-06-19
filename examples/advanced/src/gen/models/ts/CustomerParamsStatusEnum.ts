export const customerParamsStatusEnum = {
  placed: 'placed',
  approved: 'approved',
  delivered: 'delivered',
} as const

export type CustomerParamsStatusEnumKey = (typeof customerParamsStatusEnum)[keyof typeof customerParamsStatusEnum]
