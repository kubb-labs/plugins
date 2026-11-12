# Validate requests and responses

`@kubb/plugin-client` does not validate on its own. With `validator` set, it passes the schemas to your client, which runs them.

::code-group

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

::

Each generated call now includes the schemas:

```typescript
apiClient<AddPetResponses, ThrowOnError>({
  method: 'POST',
  url: '/pet',
  ...config,
  validator: { response: addPetResponseSchema, error: { 405: addPetStatus405Schema }, ...config.validator },
})
```

A `validator` passed on one call is merged per key, so `validator: { request }` adds a request schema and keeps the generated response schema. A per-call `error` replaces the generated error map as a whole.

Add a `validator` field to your `RequestConfig`, then run the schemas in `client`. Zod schemas follow [Standard Schema](https://standardschema.dev), so `~standard.validate` works with any compatible library:

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

Set `validator: { request: 'zod' }` or `{ response: 'zod' }` to pass one direction only. Without `pluginZod()` in the plugins list, generation stops with an error.

## Validate params

With `validator: { params: 'zod' }`, each call also passes the schemas for its path, query, header, and cookie params:

```typescript
apiClient<PutEventResponses, ThrowOnError>({
  method: 'PUT',
  url: '/events/{day}',
  ...config,
  validator: {
    path: putEventPathSchema,
    query: putEventQuerySchema,
    headers: toHeadersStandardSchema(putEventHeadersSchema, putEventHeadersSchema.shape),
    ...config.validator,
  },
})
```

Add `path`, `query`, `headers`, and `cookies` to the `validator` field of your `RequestConfig`. Run them on `config.path`, `config.query`, `config.headers`, and `config.cookies` before you build the URL and headers, and send the values they return.

The path and query schemas strip keys the spec does not declare, so only declared params are sent. Headers your client adds itself, such as `Authorization`, are not declared, so the headers schema passes undeclared keys through.

The generated call imports `toHeadersStandardSchema` from your `importPath` module, so that module must export it, or the generated code does not compile. `toHeadersStandardSchema` takes a Standard Schema and the object's declared keys, and returns a Standard Schema that matches the declared headers in any casing and passes undeclared headers through. Copy it from the `.kubb/standardSchema.ts` file that `@kubb/plugin-fetch` generates. Returning the schema unchanged is not enough: the plain object schema strips undeclared headers such as `Authorization`.
