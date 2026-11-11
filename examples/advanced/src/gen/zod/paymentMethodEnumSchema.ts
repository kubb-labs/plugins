import * as z from 'zod'

export const paymentMethodEnumSchema = z.enum(['card', 'cash'])

export type PaymentMethodEnumSchemaType = z.infer<typeof paymentMethodEnumSchema>
