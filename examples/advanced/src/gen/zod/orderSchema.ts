import * as z from 'zod'
import { orderHttpStatusEnumSchema } from './orderHttpStatusEnumSchema'
import { orderOrderTypeEnumSchema } from './orderOrderTypeEnumSchema'
import { orderParamsStatusEnumSchema } from './orderParamsStatusEnumSchema'
import { orderStatusEnumSchema } from './orderStatusEnumSchema'

export const orderSchema = z.object({
  id: z
    .int()
    .optional()
    .meta({ examples: [10] }),
  petId: z
    .int()
    .optional()
    .meta({ examples: [198772] }),
  params: z
    .object({
      status: orderParamsStatusEnumSchema.describe('Order Status').meta({ examples: ['approved'] }),
      type: z.string(),
    })
    .optional(),
  quantity: z
    .int()
    .optional()
    .meta({ examples: [7] }),
  orderType: orderOrderTypeEnumSchema.optional(),
  type: z
    .string()
    .optional()
    .describe('Order Status')
    .meta({ examples: ['approved'] }),
  shipDate: z.iso.datetime().optional(),
  status: orderStatusEnumSchema
    .optional()
    .describe('Order Status')
    .meta({ examples: ['approved'] }),
  http_status: orderHttpStatusEnumSchema
    .optional()
    .describe('HTTP Status')
    .meta({ examples: [200] }),
  complete: z.boolean().optional(),
})

export type OrderSchemaType = z.infer<typeof orderSchema>
