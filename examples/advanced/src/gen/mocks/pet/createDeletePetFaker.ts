import type { DeletePetHeaders, DeletePetPath } from '../../models/ts/pet/DeletePet'
import { fakerEN as faker } from '@faker-js/faker'

export function createDeletePetPathFaker<TData extends Partial<DeletePetPath> = object>(data?: TData) {
  const defaultFakeData = {
    petId: faker.number.int(),
  }
  return {
    ...defaultFakeData,
    ...(data || {}),
  } as Omit<typeof defaultFakeData, keyof TData> & TData
}

export function createDeletePetHeadersFaker<TData extends Partial<DeletePetHeaders> = object>(data?: TData) {
  const defaultFakeData = {
    apiKey: faker.string.alpha(),
  }
  return {
    ...defaultFakeData,
    ...(data || {}),
  } as Omit<typeof defaultFakeData, keyof TData> & TData
}

/**
 * @description Invalid pet value
 */
export function createDeletePetStatus400Faker() {
  return undefined
}

export function createDeletePetResponseFaker() {
  return undefined
}
