import * as z from 'zod'
import { paymentSchema } from '../../paymentSchema'

export const createPaymentStatus201Schema = paymentSchema.describe('A payment for a store order')

export type CreatePaymentStatus201SchemaType = z.infer<typeof createPaymentStatus201Schema>

export const createPaymentResponseSchema = createPaymentStatus201Schema

export type CreatePaymentResponseSchemaType = z.infer<typeof createPaymentResponseSchema>

export const createPaymentBodySchema = paymentSchema.describe('A payment for a store order')

export type CreatePaymentBodySchemaType = z.infer<typeof createPaymentBodySchema>

export const createPaymentOptionsSchema = z.object({
  body: createPaymentBodySchema,
  path: z.never().optional(),
  query: z.never().optional(),
  headers: z.never().optional(),
})

export type CreatePaymentOptionsSchemaType = z.infer<typeof createPaymentOptionsSchema>

export const createPaymentResponsesSchema = z.object({
  '201': createPaymentStatus201Schema,
})

export type CreatePaymentResponsesSchemaType = z.infer<typeof createPaymentResponsesSchema>
