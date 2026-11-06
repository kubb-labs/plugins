import * as z from 'zod'
import { orderSchema } from './orderSchema'
import { orderShippedEventEventEnumSchema } from './orderShippedEventEventEnumSchema'

export const orderShippedEventSchema = z.object({
  event: orderShippedEventEventEnumSchema,
  data: orderSchema,
  id: z.string().optional(),
  retry: z.int().min(0).optional(),
})

export type OrderShippedEventSchemaType = z.infer<typeof orderShippedEventSchema>
