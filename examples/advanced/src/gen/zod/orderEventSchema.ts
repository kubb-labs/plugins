import * as z from 'zod'
import { orderPlacedEventSchema } from './orderPlacedEventSchema'
import { orderShippedEventSchema } from './orderShippedEventSchema'
import { pingEventSchema } from './pingEventSchema'

export const orderEventSchema = z.discriminatedUnion('event', [
  orderPlacedEventSchema.extend({
    event: z.enum(['order_placed']),
  }),
  orderShippedEventSchema.extend({
    event: z.enum(['order_shipped']),
  }),
  pingEventSchema.extend({
    event: z.enum(['ping']),
  }),
])

export type OrderEventSchemaType = z.infer<typeof orderEventSchema>
