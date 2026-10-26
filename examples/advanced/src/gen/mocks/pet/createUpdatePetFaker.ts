import type { Pet } from '../../models/ts/Pet'
import { createCategoryFaker } from '../createCategoryFaker'
import { createPetFaker } from '../createPetFaker'
import { createTagTagFaker } from '../createTagTagFaker'
import { fakerEN as faker } from '@faker-js/faker'

/**
 * @description Successful operation
 */
export function createUpdatePetStatus200FakerJson<TData extends Partial<Omit<NonNullable<Pet>, 'name'>> = object>(data?: TData) {
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
export function createUpdatePetStatus200FakerXml<TData extends Partial<Omit<NonNullable<Pet>, 'name'>> = object>(data?: TData) {
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
export function createUpdatePetStatus200Faker(data?: Partial<Omit<NonNullable<Pet>, 'name'>>): Omit<NonNullable<Pet>, 'name'> {
  return (data ?? faker.helpers.arrayElement([createUpdatePetStatus200FakerJson(), createUpdatePetStatus200FakerXml()])) as Omit<NonNullable<Pet>, 'name'>
}

/**
 * @description accepted operation
 */
export function createUpdatePetStatus202Faker<
  TData extends Partial<{
    id?: number
  }> = object,
>(data?: TData) {
  const defaultFakeData = {
    id: faker.number.int(),
  }
  return {
    ...defaultFakeData,
    ...(data || {}),
  } as Omit<typeof defaultFakeData, keyof NoInfer<TData>> & NoInfer<TData>
}

/**
 * @description Invalid ID supplied
 */
export function createUpdatePetStatus400Faker() {
  return undefined
}

/**
 * @description Pet not found
 */
export function createUpdatePetStatus404Faker() {
  return undefined
}

/**
 * @description Validation exception
 */
export function createUpdatePetStatus405Faker() {
  return undefined
}

/**
 * @description Update an existent pet in the store
 */
export function createUpdatePetBodyFakerJson<TData extends Partial<Omit<NonNullable<Pet>, 'id'>> = object>(data?: TData) {
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
 * @description Update an existent pet in the store
 */
export function createUpdatePetBodyFakerXml<TData extends Partial<Omit<NonNullable<Pet>, 'id'>> = object>(data?: TData) {
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
 * @description Update an existent pet in the store
 */
export function createUpdatePetBodyFakerFormUrlEncoded<TData extends Partial<Omit<NonNullable<Pet>, 'id'>> = object>(data?: TData) {
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
 * @description Update an existent pet in the store
 */
export function createUpdatePetBodyFaker(data?: Partial<Omit<NonNullable<Pet>, 'id'>>): Omit<NonNullable<Pet>, 'id'> {
  return (data ??
    faker.helpers.arrayElement([createUpdatePetBodyFakerJson(), createUpdatePetBodyFakerXml(), createUpdatePetBodyFakerFormUrlEncoded()])) as Omit<
    NonNullable<Pet>,
    'id'
  >
}

export function createUpdatePetResponseFaker(
  data?: Partial<
    | Omit<NonNullable<Pet>, 'name'>
    | {
        id?: number
      }
  >,
):
  | Omit<NonNullable<Pet>, 'name'>
  | {
      id?: number
    } {
  return (data ??
    faker.helpers.arrayElement([
      createUpdatePetStatus200Faker(),
      createUpdatePetStatus202Faker(),
      createUpdatePetStatus400Faker(),
      createUpdatePetStatus404Faker(),
      createUpdatePetStatus405Faker(),
    ])) as
    | Omit<NonNullable<Pet>, 'name'>
    | {
        id?: number
      }
}
