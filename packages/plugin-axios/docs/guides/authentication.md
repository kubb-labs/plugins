# Authenticate requests

Set an `auth` resolver on the generated client. Operations use the [security schemes](https://spec.openapis.org/oas/v3.1.0#security-scheme-object) declared in your OpenAPI spec. Requests remain unauthenticated until you provide credentials.

## Set the auth resolver

Set the resolver for all secured operations:

```typescript
import { client } from './gen/.kubb/client'

client.setConfig({
  auth: () => localStorage.getItem('token') ?? undefined,
})
```

`auth` takes a token string or a function. The function can be async and returns a token, or `undefined` to skip that scheme. The runtime sends the first security requirement whose schemes all get a token. A requirement that needs an API key and a session cookie together sends both.

## Read the schemes of the spec

`.kubb/client.ts` exports the schemes of the spec by name as `securitySchemes`. A `mutualTLS` scheme is left out, because its credential is a client certificate in the TLS handshake, not a token the `auth` resolver can return. See [Use mutual TLS](https://kubb.dev/extensions/kubb-labs/plugin-axios/guides/authentication#use-mutual-tls). A generated operation points at its schemes there, and adds the scopes it needs:

```typescript
security: [{ ...securitySchemes.petstore_auth, scopes: ['write:pets'] }]
```

## Return the right token per scheme

Use the scheme passed to the resolver to select a credential:

```typescript
type Auth = {
  type: 'http' | 'apiKey' | 'oauth2' | 'openIdConnect'
  scheme?: 'bearer' | 'basic'
  name?: string
  in?: 'header' | 'query' | 'cookie'
}
```

The scheme decides where the runtime puts the token:

| Scheme in the spec | `Auth` object                            | Where the token goes            |
| ------------------ | ---------------------------------------- | ------------------------------- |
| `http` bearer      | `{ type: 'http', scheme: 'bearer' }`     | `Authorization: Bearer <token>` |
| `http` basic       | `{ type: 'http', scheme: 'basic' }`      | `Authorization: Basic <token>`  |
| `apiKey` header    | `{ type: 'apiKey', name, in: 'header' }` | request header named `name`     |
| `apiKey` query     | `{ type: 'apiKey', name, in: 'query' }`  | query parameter named `name`    |
| `apiKey` cookie    | `{ type: 'apiKey', name, in: 'cookie' }` | `Cookie` header                 |
| `oauth2`           | `{ type: 'oauth2' }`                     | `Authorization: Bearer <token>` |
| `openIdConnect`    | `{ type: 'openIdConnect' }`              | `Authorization: Bearer <token>` |

> [!NOTE]
> For basic auth, return the raw `username:password` string. The runtime base64-encodes it and writes the `Basic` prefix, so you never build the header yourself.

When a spec mixes schemes, branch on the `Auth` object and return the matching credential:

```typescript
client.setConfig({
  auth: (auth) => (auth.type === 'apiKey' ? apiKey : accessToken),
})
```

## Use a separate client per environment

To give each environment its own token, such as one per tenant in a multi-tenant app, build an isolated client with `createClient`:

```typescript
import { createClient } from './gen/.kubb/client'

const tenant = createClient({
  baseURL: 'https://tenant.example.com',
  auth: () => tenantToken,
})

const { data } = await getPetById({ path: { petId: 1 }, client: tenant })
```

To override the client for one request, pass `auth` on that single call, which suits a one-off token refresh. A header you set yourself always wins over the resolved token: client-level `headers`, or `headers` on a call to an operation that declares header parameters.

For authentication outside OpenAPI security schemes, use an async request interceptor to sign requests or supply custom headers.

## Use mutual TLS

For a `mutualTLS` scheme, give the axios instance the client certificate in Node.js. Every request then presents it:

```typescript
import { readFileSync } from 'node:fs'
import { Agent } from 'node:https'
import axios from 'axios'
import { client, createAxiosTransport } from './gen/.kubb/client'

const instance = axios.create({
  httpsAgent: new Agent({ cert: readFileSync('client.crt'), key: readFileSync('client.key') }),
})

client.setConfig({ transport: createAxiosTransport(instance) })
```

In the browser, the browser picks the client certificate itself.
