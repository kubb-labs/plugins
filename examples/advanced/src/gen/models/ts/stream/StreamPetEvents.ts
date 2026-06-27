import type { PetEvent } from '../PetEvent.ts'

/**
 * @description ID of pet to stream events for
 *
 * Format: `int64`
 * @type integer
 */
export type StreamPetEventsPathPetId = number

/**
 * @type object
 */
export type StreamPetEventsStatus200 = PetEvent

/**
 * @type object
 */
export type StreamPetEventsRequestConfig = {
  body?: never
  /**
   * @type object
   */
  path: {
    petId: StreamPetEventsPathPetId
  }
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
