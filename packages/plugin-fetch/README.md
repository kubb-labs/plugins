<div align="center">

<img src="https://raw.githubusercontent.com/kubb-labs/kubb/main/assets/banner.png" alt="kubb" height="150" />

# @kubb/plugin-fetch

Generate a slim, type-safe HTTP client from your OpenAPI specification, pinned to the Fetch API.

</div>

## What it does

One async function per operation, each taking a single grouped `options` object and returning the
shared `RequestResult` contract:

```ts
import { addPet } from './gen/clients/addPet'

// default (throwOnError: true): non-2xx throws ResponseError, data is always defined
const { data, response } = await addPet({ body: { name: 'Odie' } })

// throwOnError: false — errors as values, discriminated by `error`
const { data, error } = await addPet({ body: { name: 'Odie' }, throwOnError: false })
if (error) console.log(response.status)
```

The runtime is always bundled into `.kubb/client.ts`, so generated code never imports from
`@kubb/plugin-fetch`. The only runtime dependency is the global `fetch`.

## Usage

```ts
import { defineConfig } from 'kubb'
import { pluginTs } from '@kubb/plugin-ts'
import { pluginFetch } from '@kubb/plugin-fetch'

export default defineConfig({
  input: { path: './petStore.yaml' },
  output: { path: './src/gen' },
  plugins: [pluginTs(), pluginFetch({ output: { path: './clients' } })],
})
```

## Options

| Option                             | Description                                                                              |
| ---------------------------------- | ---------------------------------------------------------------------------------------- |
| `output`                           | Where the generated client files are written.                                            |
| `group`                            | Organize output into per-tag or per-path subdirectories.                                 |
| `include` / `exclude` / `override` | Filter or re-scope which operations are generated.                                       |
| `baseURL`                          | Base URL prepended to every request.                                                     |
| `parser`                           | Validate request and response bodies with `@kubb/plugin-zod`. Success (2xx) bodies only. |
| `macros`                           | AST macros applied to each operation node before printing.                               |

## Runtime

A default `client` and a `createClient` factory are exported from the generated `.kubb/client.ts`:

```ts
import { client, createClient } from './gen/.kubb/client'

client.setConfig({ baseURL: 'https://example.com' })

// swap or extend the transport through the client config — no custom plugin needed
client.setConfig({
  transport: (request) => {
    // custom fetch implementation
  },
})

const tenantClient = createClient({ baseURL: tenant.apiUrl })
```

See the [plugin-fetch docs](https://kubb.dev/plugins/plugin-fetch) for the full reference.
