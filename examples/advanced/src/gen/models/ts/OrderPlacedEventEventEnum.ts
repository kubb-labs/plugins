export const orderPlacedEventEventEnum = {
  order_placed: 'order_placed',
} as const

export type OrderPlacedEventEventEnumKey = (typeof orderPlacedEventEventEnum)[keyof typeof orderPlacedEventEventEnum]
