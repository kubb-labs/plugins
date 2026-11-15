# Validate requests and responses

Pass Zod schemas from `@kubb/plugin-zod` to your client and run them there. `@kubb/plugin-client` does not validate on its own: with `validator` set, each generated call hands the schemas to your client on `config.validator`.

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

A `validator` passed on one call is merged per key, so `validator: { request }` adds a request schema and keeps the generated response schema. A per-call `error` replaces the generated error map as a whole.

## Run them in your client

Add a `validator` field to your `RequestConfig` and run each schema in `client`. Zod schemas follow [Standard Schema](https://standardschema.dev), so `~standard.validate` works with any compatible library:

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

Return `validatedBody` as `data`, so a schema that transforms the value takes effect. Without a response schema, `validatedBody` is the original `body`.

`error` is keyed by status, such as `{ 404: schema, '5xx': schema, default: schema }`. Pick the exact status, then its range, then `default`, and skip validation when none matches.

## Validate params

With `validator: { params: 'zod' }`, each call also passes the schemas for its path, query, header, and cookie params:

```typescript
validator: {
  path: putEventPathSchema,
  query: putEventQuerySchema,
  headers: toHeadersStandardSchema(putEventHeadersSchema, putEventHeadersSchema.shape),
  ...config.validator,
}
```

Add `path`, `query`, `headers`, and `cookies` to the `validator` field of your `RequestConfig`. Run them on `config.path`, `config.query`, `config.headers`, and `config.cookies` before you build the URL and headers, and send the values they return. The path and query schemas strip keys the spec does not declare, so only declared params are sent.

The call imports `toHeadersStandardSchema` from your `importPath` module, so export it there. It wraps the headers schema so declared headers match in any casing and undeclared ones, such as an `Authorization` header your client adds, pass through. Copy it from `@kubb/plugin-client/templates/standardSchema.ts`. Returning the schema unchanged is not enough: the plain object schema strips undeclared headers.

::
