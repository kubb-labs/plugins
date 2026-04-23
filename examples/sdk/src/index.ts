/**
 * PetStoreSDK — a single entry-point for the entire PetStore API.
 *
 * The pattern mirrors https://github.com/Ilmar7786/marzban-sdk: one top-level
 * class receives a shared RequestConfig and exposes named properties for each
 * API tag (pet, store, user). Each property is an instance of the generated
 * per-tag class so callers never have to construct them individually.
 *
 * Run `pnpm generate` first to produce `./src/gen/sdk/` from the OpenAPI spec.
 *
 * @example
 * ```ts
 * const sdk = new PetStoreSDK({ baseURL: 'https://petstore3.swagger.io/api/v3' })
 *
 * const pets = await sdk.pet.findPetsByStatus({ status: 'available' })
 * const order = await sdk.store.placeOrder({ petId: 1, quantity: 2, status: 'placed' })
 * const user  = await sdk.user.getUserByName({ username: 'johndoe' })
 * ```
 */

import type { Client, RequestConfig } from '@kubb/plugin-client/clients/fetch'
import { petController } from './gen/sdk/petController/petController.ts'
import { storeController } from './gen/sdk/storeController/storeController.ts'
import { userController } from './gen/sdk/userController/userController.ts'

type SDKConfig = Partial<RequestConfig> & { client?: Client }

export class PetStoreSDK {
  /**
   * Operations related to the `pet` tag.
   * @see https://petstore3.swagger.io/#/pet
   */
  pet: petController

  /**
   * Operations related to the `store` tag.
   * @see https://petstore3.swagger.io/#/store
   */
  store: storeController

  /**
   * Operations related to the `user` tag.
   * @see https://petstore3.swagger.io/#/user
   */
  user: userController

  constructor(config: SDKConfig = {}) {
    this.pet = new petController(config)
    this.store = new storeController(config)
    this.user = new userController(config)
  }
}

export type { petController, storeController, userController, SDKConfig }
