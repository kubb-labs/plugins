import type { AddPetRequest } from '../../models/ts/AddPetRequest'
import type { Pet } from '../../models/ts/Pet'
import { createAddPetRequestFaker } from '../createAddPetRequestFaker'
import { createCategoryFaker } from '../createCategoryFaker'
import { createPetFaker } from '../createPetFaker'
import { createTagTagFaker } from '../createTagTagFaker'
import { fakerEN as faker } from '@faker-js/faker'

/**
 * @description Pet not found
 */
export function createAddPetStatus405Faker<
  TData extends Partial<{
    code?: number
    message?: string
  }> = object,
>(data?: TData) {
  const defaultFakeData = {
    code: faker.number.int(),
    message: faker.string.alpha(),
  }
  return {
    ...defaultFakeData,
    ...(data || {}),
  } as Omit<typeof defaultFakeData, keyof NoInfer<TData>> & NoInfer<TData>
}

/**
 * @description Successful operation
 */
export function createAddPetStatusDefaultFakerJson<TData extends Partial<Omit<NonNullable<Pet>, 'name'>> = object>(data?: TData) {
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
 * @description Successful operation
 */
export function createAddPetStatusDefaultFakerXml<TData extends Partial<Omit<NonNullable<Pet>, 'name'>> = object>(data?: TData) {
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
 * @description Successful operation
 */
export function createAddPetStatusDefaultFaker(data?: Partial<Omit<NonNullable<Pet>, 'name'>>): Omit<NonNullable<Pet>, 'name'> {
  return (data ?? faker.helpers.arrayElement([createAddPetStatusDefaultFakerJson(), createAddPetStatusDefaultFakerXml()])) as Omit<NonNullable<Pet>, 'name'>
}

/**
 * @description Create a new pet in the store
 */
export function createAddPetBodyFakerJson(data?: Partial<AddPetRequest>): AddPetRequest {
  return createAddPetRequestFaker(data) as AddPetRequest
}

/**
 * @description Create a new pet in the store
 */
export function createAddPetBodyFakerXml<TData extends Partial<Omit<NonNullable<Pet>, 'id'>> = object>(data?: TData) {
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

/**
 * @description Create a new pet in the store
 */
export function createAddPetBodyFakerFormUrlEncoded<TData extends Partial<Omit<NonNullable<Pet>, 'id'>> = object>(data?: TData) {
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

/**
 * @description Create a new pet in the store
 */
export function createAddPetBodyFaker(data?: Partial<AddPetRequest | Omit<NonNullable<Pet>, 'id'>>): AddPetRequest | Omit<NonNullable<Pet>, 'id'> {
  return (data ?? faker.helpers.arrayElement([createAddPetBodyFakerJson(), createAddPetBodyFakerXml(), createAddPetBodyFakerFormUrlEncoded()])) as
    | AddPetRequest
    | Omit<NonNullable<Pet>, 'id'>
}

export function createAddPetResponseFaker(
  data?: Partial<
    | {
        code?: number
        message?: string
      }
    | Omit<NonNullable<Pet>, 'name'>
  >,
):
  | {
      code?: number
      message?: string
    }
  | Omit<NonNullable<Pet>, 'name'> {
  return (data ?? faker.helpers.arrayElement([createAddPetStatus405Faker(), createAddPetStatusDefaultFaker()])) as
    | {
        code?: number
        message?: string
      }
    | Omit<NonNullable<Pet>, 'name'>
}
