import { composeClientRuntime } from '@internals/client'
import ts from 'typescript'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { source as fetchTransportSource } from './fetch.source.ts'

type LoadedClient = {
  client: {
    (config: Record<string, unknown>): Promise<{ data: unknown; error: unknown; request: Request; response: Response }>
    setConfig: (config: Record<string, unknown>) => unknown
    createClient: (config?: Record<string, unknown>) => LoadedClient['client']
  }
  createClient: (config?: Record<string, unknown>) => LoadedClient['client']
  ResponseError: new (...args: Array<unknown>) => Error
}

/**
 * Transpiles the actual injected runtime (shared core + the fetch transport prelude) and imports it,
 * so the tests run the real `.kubb/client.ts` rather than a hand-written copy.
 */
async function loadClient(): Promise<LoadedClient> {
  const composed = composeClientRuntime({ source: fetchTransportSource })
  const js = ts.transpileModule(composed, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
  }).outputText
  return import(/* @vite-ignore */ `data:text/javascript;base64,${Buffer.from(js).toString('base64')}`)
}

const json = (body: unknown, init?: ResponseInit) =>
  new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' }, ...init })

afterEach(() => {
  vi.restoreAllMocks()
})

describe('fetch transport', () => {
  it('builds a native request, parses a json body, and exposes the native response', async () => {
    const { client } = await loadClient()
    const fetchMock = vi.fn(async (_request: Request) => json({ id: 1, name: 'Odie' }))
    vi.stubGlobal('fetch', fetchMock)

    const result = await client({ method: 'GET', url: 'https://api.test/pet/1' })

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock.mock.calls[0]![0]).toBeInstanceOf(Request)
    expect(result.data).toStrictEqual({ id: 1, name: 'Odie' })
    expect(result.error).toBeUndefined()
    expect(result.response).toBeInstanceOf(Response)
    expect(result.request).toBeInstanceOf(Request)
  })

  it('serializes the body and sets the content-type on the sent request', async () => {
    const { client } = await loadClient()
    let sent: Request | undefined
    const fetchMock = vi.fn(async (request: Request) => {
      sent = request
      return json({ ok: true }, { status: 201 })
    })
    vi.stubGlobal('fetch', fetchMock)

    await client({ method: 'POST', url: 'https://api.test/pet', body: { name: 'Odie' }, contentType: 'application/json' })

    expect(sent?.method).toBe('POST')
    expect(sent?.headers.get('Content-Type')).toBe('application/json')
    expect(await sent?.text()).toBe('{"name":"Odie"}')
  })

  it('throws a ResponseError with the typed body for a non-2xx status by default', async () => {
    const { client, ResponseError } = await loadClient()
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => json({ message: 'invalid' }, { status: 405, statusText: 'Method Not Allowed' })),
    )

    await expect(client({ method: 'POST', url: 'https://api.test/pet' })).rejects.toBeInstanceOf(ResponseError)
    await expect(client({ method: 'POST', url: 'https://api.test/pet' })).rejects.toMatchObject({ status: 405, data: { message: 'invalid' } })
  })

  it('surfaces a non-2xx body as an error value when throwOnError is false', async () => {
    const { client } = await loadClient()
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => json({ message: 'invalid' }, { status: 405 })),
    )

    const result = await client({ method: 'POST', url: 'https://api.test/pet', throwOnError: false })

    expect(result.data).toBeUndefined()
    expect(result.error).toStrictEqual({ message: 'invalid' })
    expect(result.response.status).toBe(405)
  })

  it('resolves a no-content response to undefined data', async () => {
    const { client } = await loadClient()
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(null, { status: 204 })),
    )

    const result = await client({ method: 'DELETE', url: 'https://api.test/pet/1' })

    expect(result.data).toBeUndefined()
    expect(result.response.status).toBe(204)
  })

  it('resolves an empty json body to undefined instead of throwing', async () => {
    const { client } = await loadClient()
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('', { status: 200, headers: { 'Content-Type': 'application/json' } })),
    )

    const result = await client({ method: 'GET', url: 'https://api.test/pet/1' })

    expect(result.data).toBeUndefined()
    expect(result.error).toBeUndefined()
  })

  it('parses a text/plain body via content-type detection', async () => {
    const { client } = await loadClient()
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('hello world', { status: 200, headers: { 'Content-Type': 'text/plain' } })),
    )

    const result = await client({ method: 'GET', url: 'https://api.test/greeting' })

    expect(result.data).toBe('hello world')
  })

  it('uses a custom transport from the client config instead of fetch', async () => {
    const { client } = await loadClient()
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    client.setConfig({
      transport: async (request: { url: string }) => ({
        data: { from: 'custom' },
        status: 200,
        statusText: 'OK',
        headers: new Headers(),
        request,
        response: request,
      }),
    })

    const result = await client({ method: 'GET', url: 'https://api.test/pet/1' })

    expect(fetchMock).not.toHaveBeenCalled()
    expect(result.data).toStrictEqual({ from: 'custom' })
  })
})
