import * as DateTime from 'effect/DateTime'
import { Effect, Redacted } from 'effect'
import { HttpClient, HttpClientResponse } from 'effect/unstable/http'
import { describe, expect, test } from 'vitest'
import { ApiClient, makeSecurityLayer, type SecurityCredentialRequest, type SecurityCredential } from './gen/effectHttpApiClient/index.ts'

type CapturedRequest = {
  method: string
  url: string
  apiKey: string | undefined
  cookie: string | undefined
}

function makeMockClient({ body, captured }: { body: unknown; captured: Array<CapturedRequest> }): HttpClient.HttpClient {
  return HttpClient.make((request, url) => {
    captured.push({ method: request.method, url: url.toString(), apiKey: request.headers['x-api-key'], cookie: request.headers.cookie })
    return Effect.succeed(
      HttpClientResponse.fromWeb(
        request,
        new Response(JSON.stringify(body), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      ),
    )
  })
}

describe('generated Effect HttpApiClient', () => {
  test('encodes path parameters and injects a static API key', async () => {
    const captured: Array<CapturedRequest> = []
    const httpClient = makeMockClient({ body: { id: '10', name: 'Milo', photoUrls: [] }, captured })
    const program = Effect.gen(function* () {
      const client = yield* ApiClient
      return yield* client.pet.getPet({
        params: { petId: 10n },
        query: { fields: ['id', 'name'] },
        headers: { cookies: { sessionId: 'session' } },
      })
    }).pipe(
      Effect.provide(
        makeSecurityLayer({
          credentials: {
            api_key: { _tag: 'ApiKey', value: Redacted.make('secret') },
          },
        }),
      ),
      Effect.provideService(HttpClient.HttpClient, httpClient),
    )

    await expect(Effect.runPromise(program)).resolves.toMatchObject({ id: 10n, name: 'Milo' })
    expect(captured).toStrictEqual([
      {
        method: 'GET',
        url: 'https://petstore.swagger.io/v2/pets/10?fields=id%7Cname',
        apiKey: 'secret',
        cookie: 'session_id=session',
      },
    ])
  })

  test('passes endpoint scopes to a dynamic credential resolver', async () => {
    const captured: Array<CapturedRequest> = []
    const requests: Array<SecurityCredentialRequest> = []
    const httpClient = makeMockClient({ body: [], captured })
    const resolve = (request: SecurityCredentialRequest): Effect.Effect<SecurityCredential | undefined> => {
      requests.push(request)
      return Effect.succeed({ _tag: 'Bearer', token: Redacted.make('token') })
    }
    const program = Effect.gen(function* () {
      const client = yield* ApiClient
      return yield* client.pet.listPets({ query: { status: ['available', 'pending'] } })
    }).pipe(Effect.provide(makeSecurityLayer({ resolve })), Effect.provideService(HttpClient.HttpClient, httpClient))

    await Effect.runPromise(program)
    expect(requests).toStrictEqual([
      {
        endpoint: 'listPets',
        scheme: 'petstore_auth',
        scopes: ['read:pets', 'list:pets'],
      },
    ])
    expect(captured[0]?.url).toBe('https://petstore.swagger.io/v2/pets?status=available&status=pending')
  })

  test('fails before transport when no security alternative is complete', async () => {
    const captured: Array<CapturedRequest> = []
    const httpClient = makeMockClient({ body: {}, captured })
    const program = Effect.gen(function* () {
      const client = yield* ApiClient
      return yield* client.pet.getPet({ params: { petId: 10n }, query: {}, headers: { cookies: {} } })
    }).pipe(Effect.provide(makeSecurityLayer()), Effect.provideService(HttpClient.HttpClient, httpClient), Effect.flip)

    await expect(Effect.runPromise(program)).resolves.toMatchObject({
      _tag: 'MissingSecurityCredentials',
      endpoint: 'getPet',
      requirements: [['api_key'], ['petstore_auth']],
    })
    expect(captured).toStrictEqual([])
  })

  test('decodes date-time responses as DateTime.Utc', async () => {
    const captured: Array<CapturedRequest> = []
    const httpClient = makeMockClient({ body: { id: '10', shipDate: '2026-07-14T10:30:00.000Z' }, captured })
    const program = Effect.gen(function* () {
      const client = yield* ApiClient
      return yield* client.store.placeOrder({ payload: { id: 10n } })
    }).pipe(Effect.provide(makeSecurityLayer()), Effect.provideService(HttpClient.HttpClient, httpClient))

    const order = await Effect.runPromise(program)
    expect(order.shipDate && DateTime.isUtc(order.shipDate)).toBe(true)
    expect(order.shipDate && DateTime.formatIso(order.shipDate)).toBe('2026-07-14T10:30:00.000Z')
  })
})
