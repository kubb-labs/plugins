import * as z from 'zod'
import { addressSchema } from './addressSchema.ts'
import { orderParamsSchema } from './orderParamsSchema.ts'

export const customerSchema = z.object({
  id: z.int().optional(),
  username: z.string().optional(),
  params: orderParamsSchema.optional(),
  address: z.array(addressSchema).optional(),
})

export type CustomerSchemaType = z.infer<typeof customerSchema>
