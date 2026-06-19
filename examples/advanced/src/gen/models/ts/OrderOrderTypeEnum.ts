export const orderOrderTypeEnum = {
  foo: 'foo',
  bar: 'bar',
} as const

export type OrderOrderTypeEnumKey = (typeof orderOrderTypeEnum)[keyof typeof orderOrderTypeEnum]
