export const pingEventEventEnum = {
  ping: 'ping',
} as const

export type PingEventEventEnumKey = (typeof pingEventEventEnum)[keyof typeof pingEventEventEnum]
