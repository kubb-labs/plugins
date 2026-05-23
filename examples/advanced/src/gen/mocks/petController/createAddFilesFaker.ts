import type { AddFilesData } from '../../models/ts/petController/AddFiles.ts'
import { faker } from '@faker-js/faker'

export function createAddFilesDataFaker(data?: Partial<AddFilesData>): Required<AddFilesData> {
  const defaultFakeData = { url: faker.internet.url() }
  return {
    ...defaultFakeData,
    ...(data || {}),
  } as Required<AddFilesData>
}
