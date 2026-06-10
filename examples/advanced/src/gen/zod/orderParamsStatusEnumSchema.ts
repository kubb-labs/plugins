import * as z from 'zod'

export const orderParamsStatusEnumSchema = z.enum(['placed', 'approved', 'delivered']).describe('Order Status')

export type OrderParamsStatusEnumSchemaType = z.infer<typeof orderParamsStatusEnumSchema>
