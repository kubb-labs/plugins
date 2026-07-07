import type { StreamPetEventsResponse, StreamPetEventsStatus200 } from '../../models/ts/stream/StreamPetEvents.ts'
import { createPetEvent } from '../createPetEvent.ts'
import { fakerEN as faker } from '@faker-js/faker'

export function createStreamPetEventsPathPetId(data?: number): number {
  return data ?? faker.number.int()
}

/**
 * @description Server-Sent Events stream of pet changes
 */
export function createStreamPetEventsStatus200(data?: Partial<StreamPetEventsStatus200>): StreamPetEventsStatus200 {
  return createPetEvent(data) as StreamPetEventsStatus200
}

export function createStreamPetEventsResponse(data?: Partial<StreamPetEventsResponse>): StreamPetEventsResponse {
  return createStreamPetEventsStatus200(data) as StreamPetEventsResponse
}
