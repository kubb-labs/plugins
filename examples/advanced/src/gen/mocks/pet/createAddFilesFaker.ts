import type { Pet } from '../../models/ts/Pet'
import { createPetFaker } from '../createPetFaker'
import { fakerEN as faker } from '@faker-js/faker'

/**
 * @description successful operation
 */
export function createAddFilesStatus200Faker<TData extends Partial<Omit<NonNullable<Pet>, 'name'>> = object>(data?: TData) {
  const { name: _omit0, ...defaultFakeData } = createPetFaker()
  return {
    ...defaultFakeData,
    ...(data || {}),
  } as Omit<typeof defaultFakeData, keyof NoInfer<TData>> & NoInfer<TData>
}

/**
 * @description Invalid input
 */
export function createAddFilesStatus405Faker() {
  return undefined
}

export function createAddFilesBodyFakerJson<
  TData extends Partial<{
    url: string
  }> = object,
>(data?: TData) {
  const defaultFakeData = {
    url: faker.internet.url(),
  }
  return {
    ...defaultFakeData,
    ...(data || {}),
  } as Omit<typeof defaultFakeData, keyof NoInfer<TData>> & NoInfer<TData>
}

export function createAddFilesBodyFakerFormData<TData extends Partial<Omit<NonNullable<Pet>, 'id'>> = object>(data?: TData) {
  const { id: _omit0, ...defaultFakeData } = createPetFaker()
  return {
    ...defaultFakeData,
    ...(data || {}),
  } as Omit<typeof defaultFakeData, keyof NoInfer<TData>> & NoInfer<TData>
}

export function createAddFilesBodyFaker(
  data?: Partial<
    | {
        url: string
      }
    | Omit<NonNullable<Pet>, 'id'>
  >,
):
  | {
      url: string
    }
  | Omit<NonNullable<Pet>, 'id'> {
  return (data ?? faker.helpers.arrayElement([createAddFilesBodyFakerJson(), createAddFilesBodyFakerFormData()])) as
    | {
        url: string
      }
    | Omit<NonNullable<Pet>, 'id'>
}

export function createAddFilesResponseFaker(data?: Partial<Omit<NonNullable<Pet>, 'name'>>): Omit<NonNullable<Pet>, 'name'> {
  return (data ?? faker.helpers.arrayElement([createAddFilesStatus200Faker(), createAddFilesStatus405Faker()])) as Omit<NonNullable<Pet>, 'name'>
}
