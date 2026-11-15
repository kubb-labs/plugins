# Options

Pass these options to `pluginMsw()`. Shared options link to [Shared plugin options](https://kubb.dev/docs/5.x/reference/plugin-options), and this page gives only their default here.

## Options overview

| Option                                                                    | Purpose                                                                              | Default                                           |
| ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------- |
| [`output`](https://kubb.dev/docs/5.x/reference/plugin-options#output)     | Where files are written: `path`, `mode`, `barrel`, `banner`, `footer`.               | `{ path: 'handlers', barrel: { type: 'named' } }` |
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

Base URL prepended to the path each handler matches. Without it, a handler matches the operation's relative path from the spec. Set it to match a different environment than the spec. Leave off the trailing slash, because operation paths already start with `/`.

|          |          |
| -------- | -------- |
| Type     | `string` |
| Required | `false`  |

| Value                      | Handler matches                                    |
| -------------------------- | -------------------------------------------------- |
| None (default)             | `/pets/:petId`                                     |
| `'https://petstore.dev'`   | `https://petstore.dev/pets/:petId`                 |
| `'${process.env.API_URL}'` | The value of `API_URL` when the handler is created |

To set the base URL at runtime instead, pass `{ baseURL }` as a handler's second argument or to [`createHandlers`](#handlers).

### handlers

Writes a `handlers.ts` file with every generated handler in operation order.

|          |           |
| -------- | --------- |
| Type     | `boolean` |
| Required | `false`   |
| Default  | `false`   |

| Export                     | What it is                                                                                                             |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `handlers`                 | The collection with the configured `baseURL`. Spread it into `setupServer(...handlers)` or `setupWorker(...handlers)`. |
| `createHandlers(options?)` | Builds the same collection with a `baseURL` passed at runtime.                                                         |

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
Returns the data passed to the handler, typed with the `@kubb/plugin-ts` types, through `new HttpResponse(JSON.stringify(data), ...)`. Without `data`, the handler sends the first example of the success response, when the spec has one. It reads the example's `value`, else its `serializedValue`, which is parsed for a JSON response and sent as is for a text response. Pass `null` to send a `null` body.
:::

:::field{name="'faker'"}
Falls back to a value from `@kubb/plugin-faker` when `data` is `undefined` or `null`. Other falsy values, such as `0`, `false`, or `''`, are sent as the body. Register `pluginFaker()` next to this plugin.
:::

::

::code-group

```typescript ['data' (default)]
return getPetHandlerResponse200(data)
```

```typescript ['faker']
return getPetHandlerResponse200(data ?? createGetPetResponse())
```

::

Each handler file also exports one response helper per status code in the spec, such as `getPetHandlerResponse200(data)` and `getPetHandlerResponse404(data)`. Return a helper from the callback to mock another status:

```typescript [test-server.ts]
getPetHandler(() => getPetHandlerResponse404())
```

## Resolver members

A `resolver` patch overrides generated names. Members you leave out keep `resolverMsw`. Next to the shared `name`, `file`, and `imports` members described under [`resolver`](https://kubb.dev/docs/5.x/reference/plugin-options#resolver), `resolverMsw` has these:

```typescript [Partial override]
type ResolverMswPatch = {
  handler?: {
    name?(node: OperationNode): string  // → 'getPetHandler'
    listName?(): string                 // → 'handlers'
  }
}
```
