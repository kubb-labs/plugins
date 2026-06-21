/* eslint-disable no-alert, no-console */

import type { ClientConfig } from './.kubb/client'
import { PetClient } from './petClient'
import { StoreClient } from './storeClient'

export class PetStore {
  readonly pet: PetClient
  readonly store: StoreClient

  constructor(config: ClientConfig = {}) {
    this.pet = new PetClient(config)
    this.store = new StoreClient(config)
  }
}
