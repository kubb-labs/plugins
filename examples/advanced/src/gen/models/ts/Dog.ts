import type { Image } from './Image'

export type Dog = {
  /**
   * @minLength 1
   */
  readonly type: string
  name: string
  /**
   * @example linode/debian10
   */
  readonly image?: Image | null
}
