import type { AnimalTypeEnumKey } from './AnimalTypeEnum'
import type { Cat } from './Cat'
import type { Dog } from './Dog'

export type Animal = (
  | (Cat & {
      readonly type: 'cat'
    })
  | (Dog & {
      readonly type: 'dog'
    })
) & {
  readonly type: AnimalTypeEnumKey
}
