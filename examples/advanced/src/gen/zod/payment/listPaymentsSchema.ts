import * as z from 'zod'
import { paymentErrorSchema } from '../paymentErrorSchema'
import { paymentSchema } from '../paymentSchema'

export const listPaymentsQueryStatusSchema = z.string().optional()

export type ListPaymentsQueryStatusSchemaType = z.infer<typeof listPaymentsQueryStatusSchema>

export const listPaymentsQueryFilterSchema = z.string().optional()

export type ListPaymentsQueryFilterSchemaType = z.infer<typeof listPaymentsQueryFilterSchema>

export const listPaymentsCookieSessionSchema = z.string().optional()

export type ListPaymentsCookieSessionSchemaType = z.infer<typeof listPaymentsCookieSessionSchema>

export const listPaymentsStatus2XXSchema = z.array(paymentSchema)

export type ListPaymentsStatus2XXSchemaType = z.infer<typeof listPaymentsStatus2XXSchema>

export const listPaymentsStatus4XXSchema = paymentErrorSchema

export type ListPaymentsStatus4XXSchemaType = z.infer<typeof listPaymentsStatus4XXSchema>

export const listPaymentsStatus2XXHeadersSchema = z.object({
  'X-Rate-Limit': z.int().describe('Calls left this hour'),
  'X-Next-Page': z.string().optional(),
})

export type ListPaymentsStatus2XXHeadersSchemaType = z.infer<typeof listPaymentsStatus2XXHeadersSchema>

export const listPaymentsResponseSchema = listPaymentsStatus2XXSchema

export type ListPaymentsResponseSchemaType = z.infer<typeof listPaymentsResponseSchema>

export const listPaymentsErrorSchema = listPaymentsStatus4XXSchema

export type ListPaymentsErrorSchemaType = z.infer<typeof listPaymentsErrorSchema>

export const listPaymentsQuerySchema = z.object({
  status: z.string().optional(),
  filter: z.string().optional(),
})

export type ListPaymentsQuerySchemaType = z.infer<typeof listPaymentsQuerySchema>

export const listPaymentsCookiesSchema = z.object({
  session: z.string().optional(),
})

export type ListPaymentsCookiesSchemaType = z.infer<typeof listPaymentsCookiesSchema>

export const listPaymentsOptionsSchema = z.object({
  body: z.never().optional(),
  path: z.never().optional(),
  query: listPaymentsQuerySchema.optional(),
  headers: z.never().optional(),
  cookies: listPaymentsCookiesSchema.optional(),
})

export type ListPaymentsOptionsSchemaType = z.infer<typeof listPaymentsOptionsSchema>

export const listPaymentsResponsesSchema = z.object({
  '2XX': listPaymentsStatus2XXSchema,
  '4XX': listPaymentsStatus4XXSchema,
})

export type ListPaymentsResponsesSchemaType = z.infer<typeof listPaymentsResponsesSchema>
