import { fakerEN as faker } from '@faker-js/faker'

export function createUpdatePetWithFormPathFaker<
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

export function createUpdatePetWithFormQueryFaker<
  TData extends Partial<{
    name?: string
    status?: string
  }> = object,
>(data?: TData) {
  const defaultFakeData = {
    name: faker.string.alpha(),
    status: faker.string.alpha(),
  }
  return {
    ...defaultFakeData,
    ...(data || {}),
  } as Omit<typeof defaultFakeData, keyof NoInfer<TData>> & NoInfer<TData>
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
