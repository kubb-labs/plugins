import * as z from 'zod'

export const orderParamsStatusEnumSchema = z
  .enum(['placed', 'approved', 'delivered'])
  .describe('Order Status')
  .meta({ examples: ['approved'] })

export type OrderParamsStatusEnumSchemaType = z.infer<typeof orderParamsStatusEnumSchema>
