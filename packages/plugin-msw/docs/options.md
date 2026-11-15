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

## Resolver members

Members you leave out of a `resolver` patch keep `resolverMsw`. Besides the shared `name`, `file`, and `imports` members of [`resolver`](https://kubb.dev/docs/5.x/reference/plugin-options#resolver), `resolverMsw` has these:

```typescript [Partial override]
type ResolverMswPatch = {
  handler?: {
    name?(node: OperationNode): string  // → 'getPetHandler'
    listName?(): string                 // → 'handlers'
  }
}
```
