import type { StreamPetEventsPath, StreamPetEventsResponse, StreamPetEventsStatus200 } from '../../models/ts/stream/StreamPetEvents'
import { createPetEventFaker } from '../createPetEventFaker'
import { fakerEN as faker } from '@faker-js/faker'

export function createStreamPetEventsPathFaker<TData extends Partial<StreamPetEventsPath> = object>(data?: TData) {
  const defaultFakeData = {
    petId: faker.number.int(),
  }
  return {
    ...defaultFakeData,
    ...(data || {}),
  } as Omit<typeof defaultFakeData, keyof TData> & TData
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
