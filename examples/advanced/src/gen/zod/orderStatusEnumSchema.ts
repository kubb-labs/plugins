import * as z from 'zod'

/**
 * Order Status
 */
export const orderStatusEnumSchema = z
  .enum(['placed', 'approved', 'delivered'])
  .describe('Order Status')
  .meta({ examples: ['approved'] })

export type OrderStatusEnumSchemaType = z.infer<typeof orderStatusEnumSchema>
