import type { PetEvent } from '../PetEvent'

export type StreamPetEventsPath = {
  /**
   * @description ID of pet to stream events for
   *
   * Format: `int64`
   * @type integer
   */
  petId: number
}

export type StreamPetEventsStatus200 = PetEvent

export type StreamPetEventsOptions = {
  body?: never
  path: StreamPetEventsPath
  query?: never
  headers?: never
}

export type StreamPetEventsResponses = {
  '200': StreamPetEventsStatus200
}

/**
 * @description Union of all possible responses
 */
export type StreamPetEventsResponse = StreamPetEventsStatus200
