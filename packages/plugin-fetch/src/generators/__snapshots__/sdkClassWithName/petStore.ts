/* eslint-disable no-alert, no-console */

import type { ClientConfig } from './.kubb/client'
import { PetClient } from './petClient'
import { ProjectClient } from './projectClient'
import { StoreClient } from './storeClient'

export class PetStore {
  readonly pet: PetClient
  readonly store: StoreClient
  readonly project: ProjectClient

  constructor(config: ClientConfig = {}) {
    this.pet = new PetClient(config)
    this.store = new StoreClient(config)
    this.project = new ProjectClient(config)
  }
}
