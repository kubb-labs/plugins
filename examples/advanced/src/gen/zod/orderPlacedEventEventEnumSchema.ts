import * as z from 'zod'

export const orderPlacedEventEventEnumSchema = z.enum(['order_placed'])

export type OrderPlacedEventEventEnumSchemaType = z.infer<typeof orderPlacedEventEventEnumSchema>
