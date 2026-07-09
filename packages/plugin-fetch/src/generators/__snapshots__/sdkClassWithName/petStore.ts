/* eslint-disable no-alert, no-console */

import type { ClientConfig } from './.kubb/client.ts'
import { PetClient } from './petClient.ts'
import { ProjectClient } from './projectClient.ts'
import { StoreClient } from './storeClient.ts'

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
