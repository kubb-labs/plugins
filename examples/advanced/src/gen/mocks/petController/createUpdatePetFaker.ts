import type { UpdatePetData } from '../../models/ts/petController/UpdatePet.ts'
import { createPetFaker } from '../createPetFaker.ts'

/**
 * @description Update an existent pet in the store
 */
export function createUpdatePetDataFaker(data?: Partial<UpdatePetData>): UpdatePetData {
  return createPetFaker(data)
}
