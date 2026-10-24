import type { Pet } from '../../models/ts/Pet'
import { createPetFaker } from '../createPetFaker'
import { fakerEN as faker } from '@faker-js/faker'

/**
 * @description successful operation
 */
export function createAddFilesStatus200Faker(data?: Partial<Omit<NonNullable<Pet>, 'name'>>): Omit<NonNullable<Pet>, 'name'> {
  return createPetFaker(data) as Omit<NonNullable<Pet>, 'name'>
}

/**
 * @description Invalid input
 */
export function createAddFilesStatus405Faker() {
  return undefined
}

export function createAddFilesBodyFakerJson<
  TData extends Partial<
    | {
        url: string
      }
    | Omit<NonNullable<Pet>, 'id'>
  > = object,
>(data?: TData) {
  const defaultFakeData = {
    url: faker.internet.url(),
  }
  return {
    ...defaultFakeData,
    ...(data || {}),
  } as Omit<typeof defaultFakeData, keyof NoInfer<TData>> & NoInfer<TData>
}

export function createAddFilesBodyFakerFormData(
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
  return createPetFaker(data) as
    | {
        url: string
      }
    | Omit<NonNullable<Pet>, 'id'>
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
