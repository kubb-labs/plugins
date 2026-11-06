import * as z from 'zod'
import { orderEventSchema } from '../orderEventSchema'

export const streamOrderEventsPathOrderIdSchema = z.int().describe('ID of the order to stream events for')

export type StreamOrderEventsPathOrderIdSchemaType = z.infer<typeof streamOrderEventsPathOrderIdSchema>

export const streamOrderEventsStatus200Schema = orderEventSchema

export type StreamOrderEventsStatus200SchemaType = z.infer<typeof streamOrderEventsStatus200Schema>

export const streamOrderEventsResponseSchema = streamOrderEventsStatus200Schema

export type StreamOrderEventsResponseSchemaType = z.infer<typeof streamOrderEventsResponseSchema>

export const streamOrderEventsPathSchema = z.object({
  orderId: z.int().describe('ID of the order to stream events for'),
})

export type StreamOrderEventsPathSchemaType = z.infer<typeof streamOrderEventsPathSchema>

export const streamOrderEventsOptionsSchema = z.object({
  body: z.never().optional(),
  path: streamOrderEventsPathSchema,
  query: z.never().optional(),
  headers: z.never().optional(),
})

export type StreamOrderEventsOptionsSchemaType = z.infer<typeof streamOrderEventsOptionsSchema>

export const streamOrderEventsResponsesSchema = z.object({
  '200': streamOrderEventsStatus200Schema,
})

export type StreamOrderEventsResponsesSchemaType = z.infer<typeof streamOrderEventsResponsesSchema>
