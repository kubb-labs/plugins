import * as z from 'zod'
import { orderParamsSchema } from './orderParamsSchema.ts'
import { orderParamsStatusEnumSchema } from './orderParamsStatusEnumSchema.ts'

export const orderSchema = z.object({
  id: z.int().optional(),
  petId: z.int().optional(),
  params: orderParamsSchema.optional(),
  quantity: z.int().optional(),
  orderType: z.enum(['foo', 'bar']).optional(),
  type: z.string().optional().describe('Order Status'),
  shipDate: z.iso.datetime().optional(),
  status: orderParamsStatusEnumSchema.optional().describe('Order Status'),
  http_status: z
    .union([z.literal(200), z.literal(400), z.literal(500)])
    .optional()
    .describe('HTTP Status'),
  complete: z.boolean().optional(),
})

export type OrderSchema = z.infer<typeof orderSchema>
