import * as z from 'zod'
import { petEventSchema } from '../petEventSchema'

export const streamPetEventsPathPetIdSchema = z.int().describe('ID of pet to stream events for')

export type StreamPetEventsPathPetIdSchemaType = z.infer<typeof streamPetEventsPathPetIdSchema>

export const streamPetEventsStatus200Schema = petEventSchema

export type StreamPetEventsStatus200SchemaType = z.infer<typeof streamPetEventsStatus200Schema>

export const streamPetEventsResponseSchema = streamPetEventsStatus200Schema

export type StreamPetEventsResponseSchemaType = z.infer<typeof streamPetEventsResponseSchema>

export const streamPetEventsPathSchema = z.object({
  petId: z.int().describe('ID of pet to stream events for'),
})

export type StreamPetEventsPathSchemaType = z.infer<typeof streamPetEventsPathSchema>

export const streamPetEventsOptionsSchema = z.object({
  body: z.never().optional(),
  path: streamPetEventsPathSchema,
  query: z.never().optional(),
  headers: z.never().optional(),
})

export type StreamPetEventsOptionsSchemaType = z.infer<typeof streamPetEventsOptionsSchema>
