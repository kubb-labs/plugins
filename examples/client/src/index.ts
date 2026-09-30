import { setAuth, setBaseURL } from './client.ts'
import { addPet, getPetById } from './gen/clients/index.ts'
import type { Pet } from './gen/models/index.ts'

// The client is yours: configure it here, or add your own auth and retries in `client.ts`.
setBaseURL('https://petstore3.swagger.io/api/v3')

// Async auth: runs before every request the spec marks as secured. Swap in a secrets store or request signing.
setAuth(async () => 'demo-token')

export async function demo() {
  // default (throwOnError: true): data is defined, a non-2xx status throws ResponseError
  const created = await addPet({ body: { name: 'Odie', photoUrls: [] } })
  console.log(created.data, created.response.status)

  // throwOnError: false, errors are returned as values
  const result = await getPetById({ path: { petId: 1n }, throwOnError: false })
  if (result.error !== undefined) {
    console.log('failed', result.response.status)
  } else {
    const pet: Pet = result.data
    console.log('pet', pet.name)
  }
}
