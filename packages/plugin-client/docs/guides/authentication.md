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

Each entry is one OpenAPI security requirement, and the first one your client can meet is enough. A requirement that needs several schemes together, such as an API key and a session cookie, is an array: `security: [[{ type: 'apiKey', name: 'api_key', in: 'header' }, { type: 'apiKey', name: 'sid', in: 'cookie' }]]`. Send every scheme of that entry.

An operation without security requirements passes no `security` field. Use that to skip auth on public endpoints.

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

Read `config.security` and pick per operation, or pass a different `client` on a call. This works for request signing, such as AWS SigV4, and for services that use different credentials:

```typescript
import { createSignedClient } from './clients/iam'

await getPetById({ path: { petId: 1 }, client: createSignedClient() })
```

A client passed on a call replaces the default for that call only.
