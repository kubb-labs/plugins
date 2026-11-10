import * as z from 'zod'

export const paymentLabelSchema = z.enum(['priority'])

export type PaymentLabelSchemaType = z.infer<typeof paymentLabelSchema>
