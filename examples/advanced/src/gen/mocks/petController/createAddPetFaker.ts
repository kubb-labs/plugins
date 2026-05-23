import type { AddPetData } from '../../models/ts/petController/AddPet.ts'
import { createAddPetRequestFaker } from '../createAddPetRequestFaker.ts'

/**
 * @description Create a new pet in the store
 */
export function createAddPetDataFaker(data?: Partial<AddPetData>): AddPetData {
  return createAddPetRequestFaker(data)
}
