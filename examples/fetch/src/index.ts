import { client, createClient, isResponseError } from './gen/.kubb/client.ts'
import { addPet, getPetById } from './gen/clients/index.ts'
import type { GetPetByIdResponses, Pet } from './gen/models/index.ts'

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
      // The XML variant arrives as a string, so narrow on the content type for the parsed JSON.
      if (result.contentType === 'application/json') {
        const pet: Pet = result.data
        console.log('found', pet.name)
      }
      break
    }
    case 400:
    case 404:
      console.log('not found', result.error)
      break
  }

  // a thrown error narrows by status to the body the document declares for it
  try {
    await getPetById({ path: { petId: 3n } })
  } catch (error) {
    if (isResponseError<GetPetByIdResponses>(error) && error.status === 404) console.log('missing', error.data)
  }

  // an isolated instance for a different base URL, passed per call
  const tenant = createClient({ baseURL: 'https://tenant.example.com' })
  await getPetById({ path: { petId: 2n }, client: tenant })
}

type DemoResponses = { '200': Pet; '404': { message: string }; '5XX': { retryAfter: number } }

// Checking `status` narrows `data`: the `5XX` range covers every status from 500 to 599.
export function describeError(error: unknown): string {
  if (!isResponseError<DemoResponses>(error)) return 'network'
  if (error.status === 404) return error.data.message
  return `retry in ${error.data.retryAfter}s`
}
