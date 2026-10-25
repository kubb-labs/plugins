import type { PetEvent } from '../../models/ts/PetEvent'
import { createPetEventFaker } from '../createPetEventFaker'
import { fakerEN as faker } from '@faker-js/faker'

export function createStreamPetEventsPathFaker<
  TData extends Partial<{
    petId: number
  }> = object,
>(data?: TData) {
  const defaultFakeData = {
    petId: faker.number.int(),
  }
  return {
    ...defaultFakeData,
    ...(data || {}),
  } as Omit<typeof defaultFakeData, keyof NoInfer<TData>> & NoInfer<TData>
}

/**
 * @description Server-Sent Events stream of pet changes
 */
export function createStreamPetEventsStatus200Faker(data?: Partial<PetEvent>): PetEvent {
  return createPetEventFaker(data) as PetEvent
}

export function createStreamPetEventsResponseFaker(data?: Partial<PetEvent>): PetEvent {
  return createStreamPetEventsStatus200Faker(data) as PetEvent
}
