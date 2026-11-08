import * as z from 'zod'

export const orderShippedEventEventEnumSchema = z.enum(['order_shipped'])

export type OrderShippedEventEventEnumSchemaType = z.infer<typeof orderShippedEventEventEnumSchema>
