import * as z from 'zod'

/**
 * Order Status
 */
export const orderParamsStatusEnumSchema = z
  .enum(['placed', 'approved', 'delivered'])
  .describe('Order Status')
  .meta({ examples: ['approved'] })

export type OrderParamsStatusEnumSchemaType = z.infer<typeof orderParamsStatusEnumSchema>
