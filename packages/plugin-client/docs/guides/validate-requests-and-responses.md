# Validate requests and responses

Pass Zod schemas from `@kubb/plugin-zod` to your client and run them there.

::steps{level="2"}

## Pass the schemas

Add `pluginZod()` and set [`validator`](https://kubb.dev/extensions/kubb-labs/plugin-client/options#validator). Without `pluginZod()`, generation stops with an error.

```typescript [kubb.config.ts]
import { defineConfig } from 'kubb/config'
import { pluginTs } from '@kubb/plugin-ts'
import { pluginZod } from '@kubb/plugin-zod'
import { pluginClient } from '@kubb/plugin-client'

export default defineConfig({
  input: './petStore.yaml',
  output: { path: './src/gen' },
  plugins: [
    pluginTs(),
    pluginZod(),
    pluginClient({ importPath: '../../../client', validator: 'zod' }),
  ],
})
```

| `validator`           | Keys on `config.validator`            |
| --------------------- | ------------------------------------- |
| `'zod'`               | `response`, `error`                   |
| `{ response: 'zod' }` | `response`, `error`                   |
| `{ request: 'zod' }`  | `request`                             |
| `{ params: 'zod' }`   | `path`, `query`, `headers`, `cookies` |

Each generated call now carries the schemas:

```typescript
apiClient<AddPetResponses, ThrowOnError>({
  method: 'POST',
  url: '/pet',
  ...config,
  validator: { response: addPetResponseSchema, error: { 405: addPetStatus405Schema }, ...config.validator },
})
```

A `validator` passed on one call merges per key: `{ request }` adds a request schema and keeps the generated response schema. A per-call `error` replaces the whole error map.

## Run them in your client

Add a `validator` field to your `RequestConfig` and run each schema with `~standard.validate`, the [Standard Schema](https://standardschema.dev) method that Zod implements:

```typescript [src/client.ts]
type Result = { value: unknown; issues?: undefined } | { issues: ReadonlyArray<unknown> }
type Schema = { '~standard': { validate: (value: unknown) => Result | Promise<Result> } }

export type RequestConfig = {
  // ...
  validator?: { request?: Schema; response?: Schema; error?: Schema | Record<string, Schema> }
}

// inside client(), after reading the body
const result = await config.validator?.response?.['~standard'].validate(body)
if (result && 'issues' in result && result.issues) throw new Error('Response validation failed')
const validatedBody = result && 'value' in result ? result.value : body
```

Return `validatedBody` as `data`, so a schema that transforms the value takes effect.

`error` is keyed by status, such as `{ 404: schema, '5xx': schema, default: schema }`. Try the exact status, then its range, then `default`. If none matches, skip validation.

## Validate params

With `validator: { params: 'zod' }`, each call also passes its path, query, header, and cookie schemas:

```typescript
validator: {
  path: putEventPathSchema,
  query: putEventQuerySchema,
  headers: toHeadersStandardSchema(putEventHeadersSchema, putEventHeadersSchema.shape),
  ...config.validator,
}
```

1. Add `path`, `query`, `headers`, and `cookies` to the `validator` field of your `RequestConfig`.
2. Run each on `config.path`, `config.query`, `config.headers`, or `config.cookies` before you build the URL and headers.
3. Send the values they return. The path and query schemas strip keys the spec does not declare.
4. Export `toHeadersStandardSchema` from your `importPath` module. Copy it from `@kubb/plugin-client/templates/standardSchema.ts`.

> [!WARNING]
> If your `toHeadersStandardSchema` returns the schema unchanged, it strips undeclared headers, such as an `Authorization` header your client adds. The template keeps them and matches declared headers in any casing.

::
