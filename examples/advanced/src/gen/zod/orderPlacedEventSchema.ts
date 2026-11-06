import * as z from 'zod'
import { orderPlacedEventEventEnumSchema } from './orderPlacedEventEventEnumSchema'
import { orderSchema } from './orderSchema'

export const orderPlacedEventSchema = z.object({
  event: orderPlacedEventEventEnumSchema,
  data: orderSchema,
  id: z.string().optional(),
  retry: z.int().min(0).optional(),
})

export type OrderPlacedEventSchemaType = z.infer<typeof orderPlacedEventSchema>
