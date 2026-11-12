# Authenticate

Auth lives in your `client`. The plugin does not send credentials itself. It tells your client which schemes each operation needs, and your client decides what to do.

## The `security` list

Each generated function passes the operation's security schemes from the spec as `security`:

```typescript
apiClient<GetPetByIdResponses, ThrowOnError>({
  method: 'GET',
  url: '/pet/{petId}',
  security: [{ type: 'apiKey', name: 'api_key', in: 'header' }, { type: 'oauth2' }],
  ...config,
})
```

Each entry is one security requirement, and meeting one is enough. A requirement that needs several schemes together, such as an API key and a session cookie, is an array, and your client sends all of them: `security: [[{ type: 'apiKey', name: 'api_key', in: 'header' }, { type: 'apiKey', name: 'sid', in: 'cookie' }]]`.

An operation without security requirements passes no `security` field. Use that to skip auth on public endpoints.

An `oauth2` entry carries its `flows` with their URLs, and its `metadataUrl` when the spec sets `oauth2MetadataUrl`. An `openIdConnect` entry carries its discovery `url`. Your client can use them to run the flow, such as the OpenAPI 3.2 `deviceAuthorization` flow, and then send the token as a bearer token:

```typescript
security: [{ type: 'oauth2', flows: { deviceAuthorization: { deviceAuthorizationUrl: 'https://auth.example.com/device', tokenUrl: 'https://auth.example.com/token' } }, scopes: ['read'] }]
```

## Add a bearer token from an async source

The client can `await` anything before it sends the request. The client below awaits a token function you register with `setAuth`, so the token can come from a secrets store or a refresh call:

::code-group

```typescript [src/client.ts]
type GetToken = () => Promise<string | undefined>

let getToken: GetToken | undefined

export function setAuth(resolve: GetToken) {
  getToken = resolve
}

export async function client(config: RequestConfig) {
  const token = config.security?.length ? await getToken?.() : undefined

  const response = await fetch(url, {
    method: config.method,
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(config.headers as Record<string, string>) },
    // ...
  })
  // ...
}
```

```typescript [src/index.ts]
import { setAuth } from './client'

setAuth(async () => readTokenFromSecretsStore())
```

::

## Sign requests or use several auth methods

Read `config.security` and pick per operation, or pass a different `client` on a call. Both ways work for request signing, such as AWS SigV4, and for services that use different credentials:

```typescript
import { createSignedClient } from './clients/iam'

await getPetById({ path: { petId: 1 }, client: createSignedClient() })
```

The examples set [`integerType: 'number'`](https://kubb.dev/extensions/kubb-labs/adapter-oas/options#integertype) on the adapter, so an `int64` id such as `petId` is a `number`. With the default it is a `bigint` and the call takes `1n`.

A client passed on a call replaces the default for that call only.
