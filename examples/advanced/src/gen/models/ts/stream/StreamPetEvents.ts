import type { PetEvent } from '../PetEvent.ts'

/**
 * @type object
 */
export type StreamPetEventsPath = {
  /**
   * @description ID of pet to stream events for
   *
   * Format: `int64`
   * @type integer
   */
  petId: number
}

/**
 * @type object
 */
export type StreamPetEventsStatus200 = PetEvent

/**
 * @type object
 */
export type StreamPetEventsOptions = {
  body?: never
  path: StreamPetEventsPath
  query?: never
  headers?: never
}

/**
 * @type object
 */
export type StreamPetEventsResponses = {
  '200': StreamPetEventsStatus200
}

/**
 * @description Union of all possible responses
 */
export type StreamPetEventsResponse = StreamPetEventsStatus200
