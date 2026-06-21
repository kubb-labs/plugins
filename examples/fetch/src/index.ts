import { client, createClient } from './gen/.kubb/client.ts'
import { addPet, getPetById } from './gen/clients/index.ts'
import type { Pet } from './gen/models/index.ts'

// Configure the bundled runtime. There is no runtime dependency on @kubb/plugin-fetch.
client.setConfig({ baseURL: 'https://petstore3.swagger.io/api/v3' })

export async function demo() {
  // default (throwOnError: true): data is defined, a non-2xx status throws ResponseError
  const created = await addPet({ body: { name: 'Odie', photoUrls: [] } })
  console.log(created.data, created.response.status)

  // throwOnError: false — errors are returned as values, discriminated by `error`
  const result = await getPetById({ path: { petId: 1n }, throwOnError: false })
  if (result.error) {
    console.log('failed', result.response.status)
  } else {
    console.log('pet', result.data)
  }

  // switch on the top-level `status` to narrow `data`/`error` to one status' payload
  switch (result.status) {
    case 200: {
      const pet: Pet = result.data
      console.log('found', pet.name)
      break
    }
    case 400:
    case 404:
      console.log('not found', result.error)
      break
  }

  // an isolated instance for a different base URL, passed per call
  const tenant = createClient({ baseURL: 'https://tenant.example.com' })
  await getPetById({ path: { petId: 2n }, client: tenant })
}
