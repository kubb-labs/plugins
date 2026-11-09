# Set the base URL

Set `baseURL` on the client plugin or on the generated client.

> [!NOTE]
> Top-level OpenAPI server URLs do not configure the client automatically. The `server` option of `adapterOas` only sets document metadata. It does not set `baseURL`.

## Operations with their own server

A path or operation can declare its own `servers`, such as an upload or streaming host next to the main API. Its URL becomes that operation's default `baseURL`, so the call goes to that host and not to the client's. The operation's `servers` win over the path's. The entry is picked with the `server.index` of `adapterOas`, falling back to the first one, and its `{variable}` placeholders are filled from `server.variables`, then from the spec defaults.

```yaml [petStore.yaml]
paths:
  /.sse:
    servers:
      - url: https://echo.websocket.org
    get:
      operationId: streamEvents
```

```typescript
request({ method: 'GET', url: '/.sse', baseURL: 'https://echo.websocket.org', ...config })
```

Only a `baseURL` passed on the call overrides it. The `baseURL` option, `setConfig`, and `createClient` do not.

## Use the baseURL option

Pass `baseURL` to `pluginAxios` to set the generated default. Add `pluginTs` for the operation types.

```typescript [kubb.config.ts]
import { defineConfig } from 'kubb/config'
import { pluginTs } from '@kubb/plugin-ts'
import { pluginAxios } from '@kubb/plugin-axios'

export default defineConfig({
  input: './petStore.yaml',
  output: { path: './src/gen' },
  plugins: [
    pluginTs(),
    pluginAxios({ baseURL: 'https://localhost:8080/api/v1' }),
  ],
})
```

A value containing a `${...}` interpolation stays dynamic. The plugin emits it as a template literal in the generated client config, so `baseURL: '${process.env.API_URL}'` reads the environment variable when the app runs instead of baking in the build-time value.

## Set it at runtime

Use `client.setConfig` to configure all operations at startup:

```typescript
import { client } from './gen/.kubb/client'

client.setConfig({ baseURL: import.meta.env.VITE_API_URL })
```

Use `createClient` for an isolated client, then pass it to an operation:

```typescript
import { createClient } from './gen/.kubb/client'
import { getPetById } from './gen/clients/getPetById'

const staging = createClient({ baseURL: 'https://staging.petstore.swagger.io/v2' })

const { data } = await getPetById({ path: { petId: 1 }, client: staging })
```

Pass `baseURL` on a single call to override the client for that one request:

```typescript
import { getPetById } from './gen/clients/getPetById'

const { data } = await getPetById({ path: { petId: 1 }, baseURL: 'https://localhost:3000' })
```

A `baseURL` set on the call wins over the operation's own server, which wins over `createClient`, which wins over `setConfig`, which wins over the build-time value.
