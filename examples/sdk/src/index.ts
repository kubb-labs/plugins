/**
 * SDK example — instantiate generated per-tag classes and call their methods.
 *
 * Run `pnpm generate` first to produce `./src/gen/sdk/` from the OpenAPI spec.
 */

// Import the generated class for the "pet" tag.
// After running `pnpm generate` the file will be available at:
//   ./src/gen/sdk/petController/petController.ts
import type { petController } from './gen/sdk/petController/petController.ts'

// --- Instantiate with a shared base URL ---
// const pet = new petController({ baseURL: 'https://petstore3.swagger.io/api/v3' })

// --- Example calls ---
// const allPets = await pet.findPetsByStatus({ status: 'available' })
// console.log(allPets)

// const newPet = await pet.addPet({
//   name: 'Fluffy',
//   photoUrls: ['https://example.com/fluffy.jpg'],
//   status: 'available',
// })
// console.log(newPet)

export type { petController }
