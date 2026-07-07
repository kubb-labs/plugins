import type { CreatePetsBoolParamKey } from '../models/ts/CreatePetsBoolParam.ts'
import { fakerEN as faker } from '@faker-js/faker'

export function createCreatePetsBoolParamFaker(data?: CreatePetsBoolParamKey): CreatePetsBoolParamKey {
  return data ?? faker.helpers.arrayElement<CreatePetsBoolParamKey>([true])
}
