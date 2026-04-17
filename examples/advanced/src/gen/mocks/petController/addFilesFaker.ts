import { faker } from '@faker-js/faker'
import type { AddFilesData, AddFilesResponse, AddFilesStatus200 } from '../../models/ts/petController/AddFiles.ts'
import { petFaker } from '../petFaker.ts'

/**
 * @description successful operation
 */
export function addFilesStatus200Faker(data?: Partial<AddFilesStatus200>): AddFilesStatus200 {
  return petFaker(data)
}

/**
 * @description Invalid input
 */
export function addFilesStatus405Faker() {
  return undefined
}

export function addFilesDataFaker(data?: Partial<AddFilesData>): AddFilesData {
  return petFaker(data)
}

export function addFilesResponseFaker(_data?: AddFilesResponse): AddFilesResponse {
  return faker.helpers.arrayElement<any>([addFilesStatus200Faker(), addFilesStatus405Faker()])
}
