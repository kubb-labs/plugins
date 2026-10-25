import { fakerEN as faker } from '@faker-js/faker'

export function createDeletePetPathFaker<
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

export function createDeletePetHeadersFaker<
  TData extends Partial<{
    api_key?: string
  }> = object,
>(data?: TData) {
  const defaultFakeData = {
    api_key: faker.string.alpha(),
  }
  return {
    ...defaultFakeData,
    ...(data || {}),
  } as Omit<typeof defaultFakeData, keyof NoInfer<TData>> & NoInfer<TData>
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
