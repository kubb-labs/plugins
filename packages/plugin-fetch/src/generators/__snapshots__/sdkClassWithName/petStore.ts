/* eslint-disable no-alert, no-console */

import type { ClientConfig } from './.kubb/client'
import { PetClient } from './petClient'
import { StoreClient } from './storeClient'

export class PetStore {
  readonly petClient: PetClient
  readonly storeClient: StoreClient

  constructor(config: ClientConfig = {}) {
    this.petClient = new PetClient(config)
    this.storeClient = new StoreClient(config)
  }
}
