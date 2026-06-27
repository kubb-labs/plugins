import * as z from 'zod'
import { petEventSchema } from '../petEventSchema.ts'

export const streamPetEventsPathPetIdSchema = z.int().describe('ID of pet to stream events for')

export type StreamPetEventsPathPetIdSchemaType = z.infer<typeof streamPetEventsPathPetIdSchema>

export const streamPetEventsStatus200Schema = petEventSchema

export type StreamPetEventsStatus200SchemaType = z.infer<typeof streamPetEventsStatus200Schema>

export const streamPetEventsResponseSchema = streamPetEventsStatus200Schema

export type StreamPetEventsResponseSchemaType = z.infer<typeof streamPetEventsResponseSchema>
