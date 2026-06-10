import * as z from 'zod'
import { orderParamsStatusEnumSchema } from './orderParamsStatusEnumSchema.ts'

export const orderParamsSchema = z.object({
  status: orderParamsStatusEnumSchema.describe('Order Status'),
  type: z.string(),
})

export type OrderParamsSchemaType = z.infer<typeof orderParamsSchema>
