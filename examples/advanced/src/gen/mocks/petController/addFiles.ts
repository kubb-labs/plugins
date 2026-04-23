import type { AddFilesResponse, AddFilesStatus200 } from '../../models/ts/petController/AddFiles.ts'
import { petFaker } from '../pet.ts'
import { faker } from '@faker-js/faker'

/**
 * @description successful operation
 */
export function addFilesStatus200(data?: Partial<AddFilesStatus200>): AddFilesStatus200 {
  return petFaker(data)
}

/**
 * @description Invalid input
 */
export function addFilesStatus405() {
  return undefined
}

export function addFilesResponse(_data?: AddFilesResponse): AddFilesResponse {
  return faker.helpers.arrayElement<any>([addFilesStatus200(), addFilesStatus405()])
}
