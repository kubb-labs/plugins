/* eslint-disable no-alert, no-console */

import type { ClientConfig, ClientInstance } from './.kubb/client'
import { createClient } from './.kubb/client'
import { PetClient } from './pet/pet'
import { ProjectClient } from './project/project'
import { StoreClient } from './store/store'

export class PetStore {
  readonly client: ClientInstance
  readonly pet: PetClient
  readonly store: StoreClient
  readonly project: ProjectClient

  constructor(config: ClientConfig = {}) {
    this.client = createClient(config)
    this.pet = new PetClient(this.client)
    this.store = new StoreClient(this.client)
    this.project = new ProjectClient(this.client)
  }
}
