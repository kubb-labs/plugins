// version: 1.0.11

export const orderHttpStatusEnum = {
  '200': 200,
  '400': 400,
  '500': 500,
} as const

export type OrderHttpStatusEnumKey = (typeof orderHttpStatusEnum)[keyof typeof orderHttpStatusEnum]
