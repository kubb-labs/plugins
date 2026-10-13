import { once } from 'node:events'
import { createServer, type IncomingHttpHeaders } from 'node:http'
import type { AddressInfo } from 'node:net'
import { buffer } from 'node:stream/consumers'
import { type APIRequestContext, request as playwright } from '@playwright/test'
import { expect, expectTypeOf, test as baseTest } from 'vitest'
import type { Pet, PetError } from './gen/types'
import { pwAddPet, pwDeletePet, pwGetPetById, pwUpdatePetDetails, pwUploadPetPhoto } from './gen/playwright'

type ReceivedRequest = {
  method: string | undefined
  url: string
  headers: IncomingHttpHeaders
  body: Buffer
}

type PetStore = {
  request: APIRequestContext
  received: () => ReceivedRequest
}

const test = baseTest.extend<{ petStore: PetStore }>({
  petStore: async ({}, use) => {
    let received: ReceivedRequest | undefined
    const server = createServer(async (req, res) => {
      received = { method: req.method, url: req.url!, headers: req.headers, body: await buffer(req) }
      const pathname = new URL(received.url, 'http://localhost').pathname

      if (req.method === 'GET' && pathname === '/pets/missing') {
        return res.writeHead(404, { 'Content-Type': 'application/json' }).end(JSON.stringify({ message: 'Pet not found' }))
      }
      if ((req.method === 'GET' && /^\/pets\/[^/]+$/.test(pathname)) || (req.method === 'POST' && pathname === '/pets')) {
        return res
          .writeHead(req.method === 'POST' ? 201 : 200, { 'Content-Type': 'application/json', 'X-PetStore': 'local' })
          .end(JSON.stringify({ id: '123', name: 'Rex' }))
      }
      if ((req.method === 'DELETE' && /^\/pets\/[^/]+$/.test(pathname)) || (req.method === 'POST' && /^\/pets\/[^/]+\/(details|photo)$/.test(pathname))) {
        return res.writeHead(204).end()
      }
      return res.writeHead(404).end()
    })
    server.listen(0, '127.0.0.1')
    await once(server, 'listening')
    const { port } = server.address() as AddressInfo
    const request = await playwright.newContext({ baseURL: `http://127.0.0.1:${port}` })

    try {
      await use({ request, received: () => received! })
    } finally {
      try {
        await request.dispose()
      } finally {
        await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())))
      }
    }
  },
})

test('encodes paths, repeats query keys and converts numeric headers', async ({ petStore: { request, received } }) => {
  const response = await pwGetPetById({
    request,
    path: { petId: 'Rex /?#' },
    query: { tags: ['friendly', 'small & calm'], limit: undefined },
    headers: { 'X-Attempt': 2, 'X-Request-ID': undefined },
  })

  expect(response.ok()).toBe(true)
  expect(received().method).toBe('GET')
  const url = new URL(received().url, 'http://localhost')
  expect(url.pathname).toBe('/pets/Rex%20%2F%3F%23')
  expect([...url.searchParams]).toEqual([
    ['tags', 'friendly'],
    ['tags', 'small & calm'],
  ])
  expect(received().headers['x-attempt']).toBe('2')
  expect(received().headers['x-request-id']).toBeUndefined()
})

test('uses the context baseURL with optional groups omitted', async ({ petStore: { request, received } }) => {
  const response = await pwGetPetById({ request, path: { petId: '123' } })
  expect(received().url).toBe('/pets/123')
  expect(received().headers['x-attempt']).toBeUndefined()
  expect(new URL(response.url()).pathname).toBe('/pets/123')
  expectTypeOf(await response.json()).toEqualTypeOf<Pet | PetError>()
})

test('lets Playwright serialize JSON and exposes the native response', async ({ petStore: { request, received } }) => {
  const response = await pwAddPet({ request, body: { name: 'Rex', tags: ['friendly'] } })

  expect(received().method).toBe('POST')
  expect(received().url).toBe('/pets')
  expect(received().headers['content-type']).toBe('application/json')
  expect(JSON.parse(received().body.toString())).toEqual({ name: 'Rex', tags: ['friendly'] })
  expect(response.status()).toBe(201)
  expect(response.headers()['x-petstore']).toBe('local')
  expect(await response.text()).toBe('{"id":"123","name":"Rex"}')
  const pet = await response.json()
  expectTypeOf(pet).toEqualTypeOf<Pet>()
  expect(pet).toEqual({ id: '123', name: 'Rex' })
})

test('sends form fields with repeated array values', async ({ petStore: { request, received } }) => {
  await pwUpdatePetDetails({ request, path: { petId: '123' }, body: { name: 'Rex & friends', tags: ['small', 'friendly'] } })

  expect(received().url).toBe('/pets/123/details')
  expect(received().headers['content-type']).toBe('application/x-www-form-urlencoded')
  expect([...new URLSearchParams(received().body.toString())]).toEqual([
    ['name', 'Rex & friends'],
    ['tags', 'small'],
    ['tags', 'friendly'],
  ])
})

test('sends multipart fields and a Blob with a native boundary', async ({ petStore: { request, received } }) => {
  const bytes = new Uint8Array([0, 1, 127, 255])
  await pwUploadPetPhoto({
    request,
    path: { petId: '123' },
    body: { file: new Blob([bytes], { type: 'image/png' }), tags: ['portrait', 'pet'] },
  })

  expect(received().url).toBe('/pets/123/photo')
  const contentType = received().headers['content-type']!
  expect(contentType).toMatch(/^multipart\/form-data; boundary=/)
  const form = await new Response(new Uint8Array(received().body), { headers: { 'Content-Type': contentType } }).formData()
  expect(form.getAll('tags')).toEqual(['portrait', 'pet'])
  expect(form.has('description')).toBe(false)
  const file = form.get('file') as File
  expect(file.type).toBe('image/png')
  expect(new Uint8Array(await file.arrayBuffer())).toEqual(bytes)
})

test('replaces generated query and headers with native options', async ({ petStore: { request, received } }) => {
  await pwGetPetById({
    request,
    path: { petId: '123' },
    query: { tags: ['discarded'] },
    headers: { 'X-Attempt': 2 },
    options: { params: { limit: 0 }, headers: { 'X-Request-ID': 'custom' }, timeout: 0, failOnStatusCode: false },
  })

  expect(received().url).toBe('/pets/123?limit=0')
  expect(received().headers['x-attempt']).toBeUndefined()
  expect(received().headers['x-request-id']).toBe('custom')
})

test('overrides generated data with a native payload and Content-Type', async ({ petStore: { request, received } }) => {
  await pwAddPet({ request, body: { name: 'discarded' }, options: { data: 'raw', headers: { 'Content-Type': 'text/plain' } } })

  expect(received().body.toString()).toBe('raw')
  expect(received().headers['content-type']).toBe('text/plain')
})

test('replaces the generated form with a native form', async ({ petStore: { request, received } }) => {
  await pwUpdatePetDetails({
    request,
    path: { petId: '123' },
    body: { name: 'discarded', tags: ['discarded'] },
    options: { form: { name: 'Native Rex' } },
  })

  expect([...new URLSearchParams(received().body.toString())]).toEqual([['name', 'Native Rex']])
})

test('preserves the native error for conflicting body modes', async ({ petStore: { request } }) => {
  await expect(pwAddPet({ request, body: { name: 'Rex' }, options: { form: { name: 'Rex' } } })).rejects.toThrow('Only one of')
})

test('returns HTTP errors by default and honors failOnStatusCode', async ({ petStore: { request } }) => {
  const response = await pwGetPetById({ request, path: { petId: 'missing' } })
  expect(response.status()).toBe(404)
  expect(response.ok()).toBe(false)
  expect(await response.text()).toBe('{"message":"Pet not found"}')

  await expect(pwGetPetById({ request, path: { petId: 'missing' }, options: { failOnStatusCode: true } })).rejects.toThrow('404')
})

test('returns a native empty response for a deletion', async ({ petStore: { request, received } }) => {
  const response = await pwDeletePet({ request, path: { petId: '123' } })
  expect(received().method).toBe('DELETE')
  expect(received().url).toBe('/pets/123')
  expect(response.status()).toBe(204)
  expect(response.ok()).toBe(true)
  expect(await response.body()).toHaveLength(0)
})
