import type { StreamPetEventsResponse, StreamPetEventsStatus200 } from '../../models/ts/stream/StreamPetEvents.ts'
import { createPetEventFaker } from '../createPetEventFaker.ts'
import { fakerEN as faker } from '@faker-js/faker'

export function createStreamPetEventsPathPetIdFaker(data?: number): number {
  return data ?? faker.number.int()
}

/**
 * @description Server-Sent Events stream of pet changes
 */
export function createStreamPetEventsStatus200Faker(data?: Partial<StreamPetEventsStatus200>): StreamPetEventsStatus200 {
  return createPetEventFaker(data) as StreamPetEventsStatus200
}

export function createStreamPetEventsResponseFaker(data?: Partial<StreamPetEventsResponse>): StreamPetEventsResponse {
  return createStreamPetEventsStatus200Faker(data) as StreamPetEventsResponse
}
