import type { Pet } from '../../models/ts/Pet'
import { createCategoryFaker } from '../createCategoryFaker'
import { createPetFaker } from '../createPetFaker'
import { createTagTagFaker } from '../createTagTagFaker'
import { fakerEN as faker } from '@faker-js/faker'

export function createGetPetByIdPathFaker<
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
 * @description successful operation
 */
export function createGetPetByIdStatus200FakerJson<TData extends Partial<Omit<NonNullable<Pet>, 'name'>> = object>(data?: TData) {
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
 * @description successful operation
 */
export function createGetPetByIdStatus200FakerXml<TData extends Partial<Omit<NonNullable<Pet>, 'name'>> = object>(data?: TData) {
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
 * @description successful operation
 */
export function createGetPetByIdStatus200Faker(data?: Partial<Omit<NonNullable<Pet>, 'name'>>): Omit<NonNullable<Pet>, 'name'> {
  return (data ?? faker.helpers.arrayElement([createGetPetByIdStatus200FakerJson(), createGetPetByIdStatus200FakerXml()])) as Omit<NonNullable<Pet>, 'name'>
}

/**
 * @description Invalid ID supplied
 */
export function createGetPetByIdStatus400Faker() {
  return undefined
}

/**
 * @description Pet not found
 */
export function createGetPetByIdStatus404Faker() {
  return undefined
}

export function createGetPetByIdResponseFaker(data?: Partial<Omit<NonNullable<Pet>, 'name'>>): Omit<NonNullable<Pet>, 'name'> {
  return (data ?? faker.helpers.arrayElement([createGetPetByIdStatus200Faker(), createGetPetByIdStatus400Faker(), createGetPetByIdStatus404Faker()])) as Omit<
    NonNullable<Pet>,
    'name'
  >
}
