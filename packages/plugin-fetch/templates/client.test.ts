import { describe, expect, test, vi } from 'vitest'
import { createClient, createClientCore, defaultTransport } from './client.ts'
import type { Transport } from './client.ts'

test('passes createClient credentials to the transport', async () => {
  const transport = vi.fn<Transport>(async () => new Response('{}', { headers: { 'Content-Type': 'application/json' } }))
  const client = createClient({ transport, credentials: 'include' })
  await client({ method: 'GET', url: '/pet' })
  expect(transport.mock.calls[0]?.[0]?.credentials).toBe('include')
})

test('creates nothing when the module that holds it is imported', async () => {
  const fetch = vi.fn()
  vi.stubGlobal('fetch', fetch)
  const module = await import('./client.ts')
  expect(typeof module.client).toBe('function')
  expect(fetch).not.toHaveBeenCalled()
})

describe('defaultTransport', () => {
  const bytes = new Uint8Array([0xff, 0xfb, 0x90, 0x00])

  test('returns the Response with the Request it sent', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(bytes, { status: 200, headers: { 'Content-Type': 'audio/mpeg' } })),
    )
    const result = await defaultTransport({ url: 'https://example.test/speech', method: 'POST', headers: {}, body: 'hi' })
    expect(result.webResponse).toBe(result.response)
    expect(result.request).toBeInstanceOf(Request)
    expect(new Uint8Array(await result.webResponse.arrayBuffer())).toEqual(bytes)
  })

  test('decodes a binary body to a Blob through the client, and an unknown binary type with parseAs blob', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(bytes, { status: 200, headers: { 'Content-Type': 'application/vnd.custom' } })),
    )
    const client = createClientCore({ defaultTransport })
    const blob = (await client({ method: 'GET', url: 'https://example.test/file', parseAs: 'blob' })).data
    expect(blob).toBeInstanceOf(Blob)
    expect(new Uint8Array(await (blob as Blob).arrayBuffer())).toEqual(bytes)
  })

  test('passes the Next.js next option in the fetch init, which Request drops', async () => {
    const fetch = vi.fn(async (_input: Request, _init?: RequestInit) => new Response('{}', { headers: { 'Content-Type': 'application/json' } }))
    vi.stubGlobal('fetch', fetch)
    await defaultTransport({ url: 'https://example.test/pet', method: 'GET', headers: {}, options: { next: { revalidate: 60 } } })
    expect(fetch.mock.calls[0]?.[1]).toStrictEqual({ next: { revalidate: 60 } })
  })
})
