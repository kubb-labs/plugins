import type { UpdatePetWithFormPath, UpdatePetWithFormQuery } from '../../models/ts/pet/UpdatePetWithForm.ts'
import { fakerEN as faker } from '@faker-js/faker'

export function createUpdatePetWithFormPathFaker<TData extends Partial<UpdatePetWithFormPath> = object>(data?: TData) {
  const defaultFakeData = {
    petId: faker.number.int(),
  }
  return {
    ...defaultFakeData,
    ...(data || {}),
  } as Omit<typeof defaultFakeData, keyof TData> & TData
}

export function createUpdatePetWithFormQueryFaker<TData extends Partial<UpdatePetWithFormQuery> = object>(data?: TData) {
  const defaultFakeData = {
    name: faker.string.alpha(),
    status: faker.string.alpha(),
  }
  return {
    ...defaultFakeData,
    ...(data || {}),
  } as Omit<typeof defaultFakeData, keyof TData> & TData
}

/**
 * @description Invalid input
 */
export function createUpdatePetWithFormStatus405Faker() {
  return undefined
}

export function createUpdatePetWithFormResponseFaker() {
  return undefined
}
