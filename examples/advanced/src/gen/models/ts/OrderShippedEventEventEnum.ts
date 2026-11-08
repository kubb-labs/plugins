export const orderShippedEventEventEnum = {
  order_shipped: 'order_shipped',
} as const

export type OrderShippedEventEventEnumKey = (typeof orderShippedEventEventEnum)[keyof typeof orderShippedEventEventEnum]
