import { faker } from '@faker-js/faker'
import type { Pet } from '../models/ts/Pet.ts'
import { categoryFaker } from './categoryFaker.ts'
import { tagTagFaker } from './tag/tagFaker.ts'

export function petFaker(data?: Partial<Pet>): Pet {
  return {
    ...{
      id: faker.number.int(),
      parent: faker.helpers.multiple(() => undefined as any),
      signature: faker.helpers.fromRegExp('^data:image/(png|jpeg|gif|webp);base64,([A-Za-z0-9+/]+={0,2})$'),
      name: faker.string.alpha(),
      url: faker.internet.url(),
      category: categoryFaker(),
      photoUrls: faker.helpers.multiple(() => faker.string.alpha()),
      tags: faker.helpers.multiple(() => tagTagFaker()),
      status: faker.helpers.arrayElement<any>(['working', 'idle']),
    },
    ...(data || {}),
  }
}
