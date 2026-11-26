import type { Pet } from '../../models/ts/Pet'
import { createPetFaker } from '../createPetFaker'
import { fakerEN as faker } from '@faker-js/faker'

type AddFilesStatus200 = Omit<NonNullable<Pet>, 'name'>

type AddFilesBodyJson = {
  url: string
}

type AddFilesBodyFormData = Omit<NonNullable<Pet>, 'id'>

type AddFilesBody = AddFilesBodyJson | AddFilesBodyFormData

/**
 * @description successful operation
 */
export function createAddFilesStatus200Faker<TData extends Partial<AddFilesStatus200> = object>(data?: TData) {
  const { name: _omit0, ...defaultFakeData } = createPetFaker()
  return {
    ...defaultFakeData,
    ...(data || {}),
  } as unknown as Omit<typeof defaultFakeData, keyof NoInfer<TData>> & NoInfer<TData>
}

/**
 * @description Invalid input
 */
export function createAddFilesStatus405Faker() {
  return undefined
}

export function createAddFilesBodyFakerJson<TData extends Partial<AddFilesBodyJson> = object>(data?: TData) {
  const defaultFakeData = {
    url: faker.internet.url(),
  }
  return {
    ...defaultFakeData,
    ...(data || {}),
  } as Omit<typeof defaultFakeData, keyof NoInfer<TData>> & NoInfer<TData>
}

export function createAddFilesBodyFakerFormData<TData extends Partial<AddFilesBodyFormData> = object>(data?: TData) {
  const { id: _omit0, ...defaultFakeData } = createPetFaker()
  return {
    ...defaultFakeData,
    ...(data || {}),
  } as unknown as Omit<typeof defaultFakeData, keyof NoInfer<TData>> & NoInfer<TData>
}

export function createAddFilesBodyFaker(data?: Partial<AddFilesBody>): AddFilesBody {
  return (
    typeof data === 'object' && data !== null && !Array.isArray(data)
      ? faker.helpers.arrayElement([
          () => createAddFilesBodyFakerJson(data as Partial<AddFilesBodyJson>),
          () => createAddFilesBodyFakerFormData(data as Partial<AddFilesBodyFormData>),
        ])()
      : (data ?? faker.helpers.arrayElement([createAddFilesBodyFakerJson(), createAddFilesBodyFakerFormData()]))
  ) as AddFilesBody
}

export function createAddFilesResponseFaker(data?: Partial<AddFilesStatus200>): AddFilesStatus200 {
  return createAddFilesStatus200Faker(data) as AddFilesStatus200
}
