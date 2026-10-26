import type { Pet } from '../../models/ts/Pet'
import { createCategoryFaker } from '../createCategoryFaker'
import { createPetFaker } from '../createPetFaker'
import { createTagTagFaker } from '../createTagTagFaker'
import { fakerEN as faker } from '@faker-js/faker'

/**
 * @description successful operation
 */
export function createAddFilesStatus200Faker<TData extends Partial<Omit<NonNullable<Pet>, 'name'>> = object>(data?: TData) {
  const defaultFakeData = {
    id: faker.number.int(),
    get parent() {
      const _value = faker.helpers.multiple(() => createPetFaker())
      Object.defineProperty(this, 'parent', { value: _value, configurable: true, writable: true, enumerable: true })
      return _value
    },
    signature: faker.helpers.fromRegExp(/^data:image\/(png|jpeg|gif|webp);base64,([A-Za-z0-9+/]+={0,2})$/),
    url: faker.internet.url(),
    category: createCategoryFaker(),
    photoUrls: faker.helpers.multiple(() => faker.string.alpha()),
    tags: faker.helpers.multiple(() => createTagTagFaker()),
    status: faker.helpers.arrayElement<NonNullable<Omit<NonNullable<Pet>, 'name'>>['status']>(['available', 'pending', 'sold']),
  }
  if (data) {
    for (const [key, value] of Object.entries(data)) {
      Object.defineProperty(defaultFakeData, key, { value, configurable: true, writable: true, enumerable: true })
    }
  }
  return defaultFakeData as Omit<typeof defaultFakeData, keyof NoInfer<TData>> & NoInfer<TData>
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
  const defaultFakeData = {
    get parent() {
      const _value = faker.helpers.multiple(() => createPetFaker())
      Object.defineProperty(this, 'parent', { value: _value, configurable: true, writable: true, enumerable: true })
      return _value
    },
    signature: faker.helpers.fromRegExp(/^data:image\/(png|jpeg|gif|webp);base64,([A-Za-z0-9+/]+={0,2})$/),
    name: faker.string.alpha(),
    url: faker.internet.url(),
    category: createCategoryFaker(),
    photoUrls: faker.helpers.multiple(() => faker.string.alpha()),
    tags: faker.helpers.multiple(() => createTagTagFaker()),
    status: faker.helpers.arrayElement<NonNullable<Omit<NonNullable<Pet>, 'id'>>['status']>(['available', 'pending', 'sold']),
  }
  if (data) {
    for (const [key, value] of Object.entries(data)) {
      Object.defineProperty(defaultFakeData, key, { value, configurable: true, writable: true, enumerable: true })
    }
  }
  return defaultFakeData as Omit<typeof defaultFakeData, keyof NoInfer<TData>> & NoInfer<TData>
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
