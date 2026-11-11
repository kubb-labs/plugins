import * as z from 'zod'
import { paymentSchema } from '../../paymentSchema'

export const getPaymentByIdPathPaymentIdSchema = z.int()

export type GetPaymentByIdPathPaymentIdSchemaType = z.infer<typeof getPaymentByIdPathPaymentIdSchema>

export const getPaymentByIdStatus200Schema = paymentSchema.describe('A payment for a store order')

export type GetPaymentByIdStatus200SchemaType = z.infer<typeof getPaymentByIdStatus200Schema>

export const getPaymentByIdResponseSchema = getPaymentByIdStatus200Schema

export type GetPaymentByIdResponseSchemaType = z.infer<typeof getPaymentByIdResponseSchema>

export const getPaymentByIdPathSchema = z.object({
  paymentId: z.int(),
})

export type GetPaymentByIdPathSchemaType = z.infer<typeof getPaymentByIdPathSchema>

export const getPaymentByIdOptionsSchema = z.object({
  body: z.never().optional(),
  path: getPaymentByIdPathSchema,
  query: z.never().optional(),
  headers: z.never().optional(),
})

export type GetPaymentByIdOptionsSchemaType = z.infer<typeof getPaymentByIdOptionsSchema>

export const getPaymentByIdResponsesSchema = z.object({
  '200': getPaymentByIdStatus200Schema,
})

export type GetPaymentByIdResponsesSchemaType = z.infer<typeof getPaymentByIdResponsesSchema>
