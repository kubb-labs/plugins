# Options

Pass these options to `pluginMsw()`. Shared options link to [Shared plugin options](https://kubb.dev/docs/5.x/reference/plugin-options), and this page gives only their default here.

## Options overview

| Option                                                                    | Purpose                                                                              | Default                                           |
| ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------- |
| [`output`](https://kubb.dev/docs/5.x/reference/plugin-options#output)     | Where files are written.                                                             | `{ path: 'handlers', barrel: { type: 'named' } }` |
| [`group`](https://kubb.dev/docs/5.x/reference/plugin-options#group)       | Split output by tag or path.                                                         | None                                              |
| [`baseURL`](#baseurl)                                                     | Base URL prepended to every handler's path.                                          | None                                              |
| [`handlers`](#handlers)                                                   | Write a `handlers.ts` that exports every handler.                                    | `false`                                           |
| [`parser`](#parser)                                                       | Source of the response body each handler returns.                                    | `'data'`                                          |
| [`mediaTypes`](#mediatypes)                                               | Encode the response body of a media type with your own function.                     | `{}`                                              |
| [`include`](https://kubb.dev/docs/5.x/reference/plugin-options#include)   | Keep only operations that match.                                                     | None                                              |
| [`exclude`](https://kubb.dev/docs/5.x/reference/plugin-options#exclude)   | Skip operations that match.                                                          | `[]`                                              |
| [`override`](https://kubb.dev/docs/5.x/reference/plugin-options#override) | Apply different options per pattern.                                                 | `[]`                                              |
| [`resolver`](https://kubb.dev/docs/5.x/reference/plugin-options#resolver) | Customize generated names and file paths. See [resolver members](#resolver-members). | `resolverMsw`                                     |
| [`macros`](https://kubb.dev/docs/5.x/reference/plugin-options#macros)     | Rewrite AST nodes before printing.                                                   | `[]`                                              |

## Option details

### baseURL

Base URL prepended to the path each handler matches. Without it, a handler matches the operation's relative path. Leave off the trailing slash, because operation paths start with `/`.

|          |          |
| -------- | -------- |
| Type     | `string` |
| Required | `false`  |

| Value                      | Handler matches                                    |
| -------------------------- | -------------------------------------------------- |
| None (default)             | `/pets/:petId`                                     |
| `'https://petstore.dev'`   | `https://petstore.dev/pets/:petId`                 |
| `'${process.env.API_URL}'` | The value of `API_URL` when the handler is created |

To set the base URL at runtime, pass `{ baseURL }` as a handler's second argument or to [`createHandlers`](#handlers).

### handlers

Writes a `handlers.ts` with every handler in operation order.

|          |           |
| -------- | --------- |
| Type     | `boolean` |
| Required | `false`   |
| Default  | `false`   |

| Export                     | What it is                                                                                                 |
| -------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `handlers`                 | Every handler with the configured `baseURL`, for `setupServer(...handlers)` or `setupWorker(...handlers)`. |
| `createHandlers(options?)` | Builds the same list with a `baseURL` passed at runtime.                                                   |

```typescript [src/gen/handlers/handlers.ts]
import { getPetHandler } from './getPetHandler'
import { addPetHandler } from './addPetHandler'

export function createHandlers(options?: { baseURL?: string }) {
  return [getPetHandler(undefined, options), addPetHandler(undefined, options)] as const
}

export const handlers = createHandlers()
```

### parser

Source of the response body each handler returns.

|          |                     |
| -------- | ------------------- |
| Type     | `'data' \| 'faker'` |
| Required | `false`             |
| Default  | `'data'`            |

::field-group

:::field{name="'data'"}
Returns the data you pass, typed with the `@kubb/plugin-ts` types. Without `data`, the handler sends the first example of the success response, when the spec has one. Pass `null` to send a `null` body.
:::

:::field{name="'faker'"}
Falls back to a `@kubb/plugin-faker` value when `data` is `undefined` or `null` and the success response has a schema. Other falsy values, such as `0`, are sent as the body. Register `pluginFaker()` next to this plugin.
:::

::

See [Examples from the spec](https://kubb.dev/extensions/kubb-labs/plugin-msw/guides/mock-api#examples-from-the-spec).

::code-group

```typescript ['data' (default)]
return getPetHandlerResponse200(data)
```

```typescript ['faker']
return getPetHandlerResponse200(data ?? createGetPetResponse())
```

::

Each handler file also exports one response helper per status code, such as `getPetHandlerResponse404(data)`. Return a helper from the callback to mock that status:

```typescript [test-server.ts]
getPetHandler(() => getPetHandlerResponse404())
```

### mediaTypes

Encoders for response bodies, keyed by media type. Without one, a mock sends its data as JSON, as text, or as one Server-Sent Event. Register an encoder when your client expects another format, such as framed NDJSON.

|          |                                                  |
| -------- | ------------------------------------------------ |
| Type     | `Record<string, { name: string; path: string }>` |
| Required | `false`                                          |
| Default  | `{}`                                             |

::field-group

:::field{name="name"}
Name of the exported function. It gets the handler's `data` and returns a body the `Response` constructor accepts, such as a string or a `ReadableStream`. `data` is `undefined` when a mock has none.
:::

:::field{name="path"}
Import path, written to the handler file as it is. Use a package name or a path alias.
:::

::

```typescript [kubb.config.ts]
pluginMsw({
  mediaTypes: {
    'application/vnd.acme.stream+json': { name: 'encodeStream', path: '@acme/runtime' },
  },
})
```

A response uses the encoder when the content type its mock sends matches the key. Parameters such as `charset` are ignored. The match applies to the handler and to the response helper of every status with that content type:

```typescript [src/gen/handlers/streamLogsHandler.ts]
import { encodeStream } from '@acme/runtime'

export function streamLogsHandlerResponse200(data?: StreamLogsResponse) {
  return new HttpResponse(encodeStream(data), {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.acme.stream+json',
    },
  })
}
```

The status, the `Content-Type` header, and the other responses stay as generated. When the spec declares a plain type such as `application/json` for the operation, set the content type with a [`macros`](https://kubb.dev/docs/5.x/reference/plugin-options#macros) entry and register the encoder under it.

## Resolver members

`resolver` takes one patch or an array of patches. An array merges over `resolverMsw` from left to right.

Members you leave out of a `resolver` patch keep `resolverMsw`. Besides the shared `name`, `file`, and `imports` members of [`resolver`](https://kubb.dev/docs/5.x/reference/plugin-options#resolver), `resolverMsw` has these:

```typescript [Partial override]
type ResolverMswPatch = {
  handler?: {
    name?(node: OperationNode): string  // → 'getPetHandler'
    listName?(): string                 // → 'handlers'
  }
}
```
