import * as z from 'zod'
import { orderParamsSchema } from './orderParamsSchema.ts'
import { orderParamsStatusEnumSchema } from './orderParamsStatusEnumSchema.ts'

export const orderSchema = z.object({
  id: z
    .int()
    .optional()
    .meta({ examples: [10] }),
  petId: z
    .int()
    .optional()
    .meta({ examples: [198772] }),
  params: orderParamsSchema.optional(),
  quantity: z
    .int()
    .optional()
    .meta({ examples: [7] }),
  orderType: z.enum(['foo', 'bar']).optional(),
  type: z
    .string()
    .optional()
    .describe('Order Status')
    .meta({ examples: ['approved'] }),
  shipDate: z.iso.datetime().optional(),
  status: orderParamsStatusEnumSchema
    .optional()
    .describe('Order Status')
    .meta({ examples: ['approved'] }),
  http_status: z
    .union([z.literal(200), z.literal(400), z.literal(500)])
    .optional()
    .describe('HTTP Status')
    .meta({ examples: [200] }),
  complete: z.boolean().optional(),
})

export type OrderSchemaType = z.infer<typeof orderSchema>
