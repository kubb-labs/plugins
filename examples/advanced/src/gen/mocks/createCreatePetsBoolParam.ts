import type { CreatePetsBoolParamKey } from '../models/ts/CreatePetsBoolParam.ts'
import { fakerEN as faker } from '@faker-js/faker'

export function createCreatePetsBoolParam(data?: CreatePetsBoolParamKey): CreatePetsBoolParamKey {
  return data ?? faker.helpers.arrayElement<CreatePetsBoolParamKey>([true])
}
