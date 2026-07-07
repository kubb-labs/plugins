import type { PetEvent } from '../models/ts/PetEvent.ts'
import { createPet } from './createPet.ts'
import { createPetEventTypeEnum } from './createPetEventTypeEnum.ts'
import { fakerEN as faker } from '@faker-js/faker'

export function createPetEvent<TData extends Partial<PetEvent> = object>(data?: TData) {
  const defaultFakeData = {
    type: createPetEventTypeEnum(),
    get pet() {
      const _value = createPet()
      Object.defineProperty(this, 'pet', { value: _value, configurable: true, writable: true, enumerable: true })
      return _value
    },
    timestamp: faker.date.anytime().toISOString(),
  }
  if (data) {
    for (const [key, value] of Object.entries(data)) {
      Object.defineProperty(defaultFakeData, key, { value, configurable: true, writable: true, enumerable: true })
    }
  }
  return defaultFakeData as Omit<typeof defaultFakeData, keyof TData> & TData
}
