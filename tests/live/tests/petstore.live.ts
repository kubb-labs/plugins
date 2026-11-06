import { describe, expect, test } from 'vitest'
import * as fetchGen from '../gen/petstore3-fetch/index.ts'
import * as axiosGen from '../gen/petstore3-axios/index.ts'
import type { Pet } from '../gen/petstore3-fetch/models/Pet.ts'

const flavors = { fetch: fetchGen, axios: axiosGen as unknown as typeof fetchGen }

describe.each(Object.entries(flavors))('petstore3 over %s', (flavor, gen) => {
  const { client, createClient, ResponseError } = gen
  const petId = BigInt(Date.now()) * 1000n + BigInt(Math.floor(Math.random() * 1000))
  const pet: Pet = { id: petId, name: `kubb-${flavor}`, photoUrls: ['https://example.com/a.png'], status: 'available', tags: [{ id: 1n, name: 'v6' }] }

  test('GET with a query parameter narrows data by status', async () => {
    const result = await gen.findPetsByStatus({ query: { status: 'available' } })
    expect(result.status).toBe(200)
    expect(result.contentType).toBe('application/json')
    expect(Array.isArray(result.data)).toBe(true)
    if (result.status === 200) expect(result.data.length).toBeGreaterThan(0)
    expect(result.error).toBeUndefined()
  })

  test('POST JSON with a bigint id, then GET it back and DELETE it', async () => {
    const created = await gen.addPet({ body: pet })
    expect(created.status).toBe(200)
    expect(created.data.name).toBe(pet.name)
    // int64 is typed as bigint, but the JSON body arrives as a number (issue #1354).
    expect(BigInt(created.data.id as unknown as number)).toBe(petId)

    const fetched = await gen.getPetById({ path: { petId } }).unwrap()
    expect(fetched.name).toBe(pet.name)
    expect(fetched.tags?.[0]?.name).toBe('v6')

    const updated = await gen.updatePetWithForm({ path: { petId }, query: { name: 'renamed', status: 'sold' } })
    expect(updated.data.name).toBe('renamed')
    expect(updated.data.status).toBe('sold')

    // Petstore answers DELETE with `Content-Type: application/json` and the text `Pet deleted`.
    const deleted = await gen.deletePet({ path: { petId }, headers: { api_key: 'special-key' } })
    expect(deleted).toMatchObject({ status: 200, data: 'Pet deleted' })
  })

  test('404 throws a ResponseError by default and resolves with throwOnError false', async () => {
    const missing = 999_999_999_999n
    const error = await gen.getPetById({ path: { petId: missing } }).catch((e: unknown) => e)
    if (!ResponseError.is(error)) throw error
    expect(error.status).toBe(404)
    expect(error.data).toBe('Pet not found')
    expect(error.message).toBe(`GET https://petstore3.swagger.io/api/v3/pet/${missing} failed with status 404 Not Found`)

    const result = await gen.getPetById({ path: { petId: missing }, throwOnError: false })
    expect(result.status).toBe(404)
    if (result.status === 404) expect(result.error).toBe('Pet not found')
    expect(result.data).toBeUndefined()
    await expect(gen.getPetById({ path: { petId: missing }, throwOnError: false }).unwrap()).rejects.toBe('Pet not found')
  })

  test('uploads a raw binary body as application/octet-stream', async () => {
    await gen.addPet({ body: pet })
    const bytes = new Blob([new Uint8Array([0x89, 0x50, 0x4e, 0x47, 1, 2, 3])])
    const result = await gen.uploadFile({ path: { petId }, query: { additionalMetadata: 'kubb' }, body: bytes })
    expect(result.status).toBe(200)
    // petstore3 answers with the Pet, not the ApiResponse its document declares.
    expect((result.data as unknown as Pet).photoUrls.at(-1)).toMatch(/^\/tmp\//)
    await gen.deletePet({ path: { petId }, headers: { api_key: 'special-key' } })
  })

  test('places an order with a date-time and reads inventory through the apiKey resolver', async () => {
    const seen: Array<unknown> = []
    const own = createClient({ auth: (auth) => (seen.push(auth), auth.type === 'apiKey' ? 'special-key' : undefined) })
    const inventory = await gen.getInventory({ client: own })
    expect(inventory.status).toBe(200)
    expect(typeof inventory.data).toBe('object')
    expect(seen).toStrictEqual([{ type: 'apiKey', name: 'api_key', in: 'header' }])

    const order = await gen.placeOrder({ body: { id: 10n, petId: 1n, quantity: 2, shipDate: '2026-01-02T03:04:05Z', status: 'placed', complete: false } })
    expect(order.status).toBe(200)
    expect(order.data.quantity).toBe(2)
    expect(String(order.data.shipDate)).toContain('2026-01-02')
  })

  test('core interceptors run with the same objects on both clients', async () => {
    const own = createClient()
    const seen: Array<string> = []
    own.interceptors.request.use((request) => {
      expect(request.url).toMatch(/^https:\/\/petstore3\.swagger\.io\/api\/v3\/pet\//)
      request.headers['X-Trace'] = 'abc'
      seen.push(`request ${request.method}`)
      return request
    })
    own.interceptors.response.use((result) => (seen.push(`response ${result.status} ${result.headers.get('content-type')}`), result))
    own.interceptors.error.use((error) => (seen.push(`error ${error.status} ${error.name}`), error))

    await gen.findPetsByStatus({ query: { status: 'sold' }, client: own })
    await expect(gen.getPetById({ path: { petId: 999_999_999_999n }, client: own })).rejects.toBeInstanceOf(Error)
    expect(seen).toStrictEqual(['request GET', 'response 200 application/json', 'request GET', 'response 404 application/xml', 'error 404 ResponseError'])
  })

  test('an isolated client keeps its own baseURL and leaves the shared client alone', async () => {
    const own = createClient({ baseURL: 'https://petstore3.swagger.io/api/v2-does-not-exist' })
    const result = await gen.findPetsByStatus({ query: { status: 'sold' }, client: own, throwOnError: false })
    expect(result.status).toBe(404)
    expect(client.getConfig().baseURL).toBe('https://petstore3.swagger.io/api/v3')
    expect(client.getUrl({ url: '/pet/{petId}', path: { petId: 5 }, query: { a: [1, 2] } })).toBe('https://petstore3.swagger.io/api/v3/pet/5?a=1&a=2')
  })

  test('an aborted signal rejects before the server answers', async () => {
    const controller = new AbortController()
    const call = gen.findPetsByStatus({ query: { status: 'pending' }, signal: controller.signal })
    controller.abort(new Error('stop'))
    const error = await call.catch((e: unknown) => e)
    expect(error).toBeInstanceOf(Error)
    expect(ResponseError.is(error)).toBe(false)
  })
})

test('fetch results carry the native Request and Response', async () => {
  const result = await fetchGen.findPetsByStatus({ query: { status: 'sold' }, options: { cache: 'no-store' } })
  expect(result.request).toBeInstanceOf(Request)
  expect(result.request.cache).toBe('no-store')
  expect(result.response).toBeInstanceOf(Response)
  expect(result.response.headers.get('content-type')).toContain('application/json')
  expect(result.response.bodyUsed).toBe(true)
})

test('axios results carry the axios config and response, and options reach the request', async () => {
  const result = await axiosGen.findPetsByStatus({ query: { status: 'sold' }, options: { timeout: 20_000 } })
  expect(result.request.url).toBe('https://petstore3.swagger.io/api/v3/pet/findByStatus?status=sold')
  expect(result.request.timeout).toBe(20_000)
  expect(result.response.status).toBe(200)
  expect(result.response.config.method).toBe('get')
})
