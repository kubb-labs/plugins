import { afterEach, describe, expect, it, vi } from 'vitest'
import { client, ResponseError } from './fetch'

function mockFetch(response: Response) {
  return vi.spyOn(globalThis, 'fetch').mockResolvedValue(response)
}

function jsonResponse(body: unknown, init: ResponseInit) {
  return new Response(JSON.stringify(body), { headers: { 'Content-Type': 'application/json' }, ...init })
}

describe('client', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('resolves with the parsed body and response metadata on a 2xx response', async () => {
    using _ = mockFetch(jsonResponse({ status: 'ok' }, { status: 200, statusText: 'OK' }))

    const res = await client<{ status: string }>({ method: 'GET', url: 'https://example.com/status' })

    expect(res.status).toBe(200)
    expect(res.data).toStrictEqual({ status: 'ok' })
  })

  it('throws a ResponseError carrying the parsed body on a non-2xx response', async () => {
    using _ = mockFetch(jsonResponse({ detail: 'invalid' }, { status: 422, statusText: 'Unprocessable Entity' }))

    const promise = client<{ status: string }, { detail: string }>({ method: 'GET', url: 'https://example.com/status' })

    await expect(promise).rejects.toBeInstanceOf(ResponseError)
    await expect(promise).rejects.toMatchObject({
      name: 'ResponseError',
      message: 'Request failed with status 422 Unprocessable Entity',
      response: { status: 422, data: { detail: 'invalid' } },
    })
  })

  it('throws a ResponseError with an empty object body when the error response has no body', async () => {
    using _ = mockFetch(new Response(null, { status: 500 }))

    await expect(client({ method: 'GET', url: 'https://example.com/status' })).rejects.toMatchObject({
      response: { status: 500, data: {} },
    })
  })

  it('resolves with an empty object body on a 204 response', async () => {
    using _ = mockFetch(new Response(null, { status: 204 }))

    const res = await client({ method: 'DELETE', url: 'https://example.com/status' })

    expect(res.status).toBe(204)
    expect(res.data).toStrictEqual({})
  })
})
