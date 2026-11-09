# Migrate to v6

The fetch client keeps its API in v6, so most projects only regenerate. Find your code in the table, then follow its section.

## What to change

| Your code                                                                                                            | What to do                                                                                                           |
| -------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Calls generated functions, SDK methods, or hooks                                                                     | Regenerate. Nothing else.                                                                                            |
| Imports from `templates/fetch.ts`, `templates/core.ts`, `templates/serializers.ts`, or `templates/standardSchema.ts` | Import from `templates/client.ts` or `@kubb/plugin-client/templates/*`. See [Template subpaths](#template-subpaths). |
| Uses `FetchOptions`                                                                                                  | Rename it to `NativeOptions`. See [Removed exports](#removed-exports).                                               |
| Names `EventStreamResult<Pet>`, `StreamResult`, or `UnwrappedStreamResult`                                           | Wrap the payload: `EventStreamResult<ServerSentEvent<Pet>>`. See [Stream result types](#stream-result-types).        |
| Comes from 5.12 or earlier and uses streams                                                                          | Check [From 5.12 or earlier](#from-5-12-or-earlier). It compiles, so the type checker does not catch it.             |
| Uses SDK classes with `group: { type: 'tag' }`, such as `new pet(config)`                                            | Rename them to the PascalCase names, such as `new PetClient(config)`. See [SDK class names](#sdk-class-names).       |

## Upgrade steps

1. Upgrade `kubb` and `@kubb/plugin-fetch` together. v6 needs Kubb 5.16.0 or later:

   ```bash
   npm install --save-dev kubb@latest @kubb/plugin-fetch@6
   ```

2. Regenerate the client, which rewrites `.kubb/` and the operation files:

   ```bash
   npx kubb generate
   ```

3. Run the type checker. Each breaking change shows up as a compile error in your own code:

   ```bash
   npx tsc --noEmit
   ```

4. Fix each error with its row in [What to change](#what-to-change).

## Template subpaths

`@kubb/plugin-fetch/templates/fetch.ts`, `templates/core.ts`, `templates/serializers.ts`, and `templates/standardSchema.ts` are gone. Import the client types from `@kubb/plugin-fetch/templates/client.ts`, and the shared runtime from `@kubb/plugin-client/templates/*`:

```typescript
// before
import type { RequestConfig } from '@kubb/plugin-fetch/templates/fetch.ts'
import type { ResolvedRequest } from '@kubb/plugin-fetch/templates/core.ts'

// after
import type { RequestConfig } from '@kubb/plugin-fetch/templates/client.ts'
import type { ResolvedRequest } from '@kubb/plugin-client/templates/core.ts'
```

The package exports `templates/client.ts` for its types only. Runtime values such as `client` still come from the generated `.kubb/client.ts`.

## Removed exports

Rename `FetchOptions` to `NativeOptions`. It is the same type, `RequestInit` plus Next.js's `next`:

```typescript
// before
import type { FetchOptions } from './gen/.kubb/client'

// after
import type { NativeOptions } from './gen/.kubb/client'
```

## Stream result types

`EventStreamResult`, `StreamResult`, and `UnwrappedStreamResult` take the full event type, not the payload. Wrap a payload in `ServerSentEvent`:

```typescript
// before
let result: EventStreamResult<PetEvent>

// after
let result: EventStreamResult<ServerSentEvent<PetEvent>>
```

A stream typed with `TypedEvent<…>` stays the same.

## From 5.12 or earlier

These changed in 5.13 and compile without errors, so check them by hand:

- A successful stream call with a body that is not a stream, such as a JSON body, throws a `TypeError` with the body as its `cause`. A successful answer with no body still ends as an empty stream.
- An event the server ends without a blank line is dropped, as browser `EventSource` does, so end every event with one.

## SDK class names

With `sdk` and `group: { type: 'tag' }`, tag classes used the group folder name, such as `export class pet`. They now use `resolver.groupName`, such as `export class PetClient`, as without `group`. The files stay where they were, and the root class keeps its `pet` and `store` fields.

```diff
- import { pet } from './gen/sdk/pet/pet'
- const api = new pet({ baseURL })
+ import { PetClient } from './gen/sdk/pet/pet'
+ const api = new PetClient({ baseURL })
```

The root class now creates one client and shares it with every tag, so it builds one client instead of one per tag. Reach it as `api.client` to add interceptors.

## Query plugins

`@kubb/plugin-react-query`, `@kubb/plugin-vue-query`, `@kubb/plugin-swr`, and `@kubb/plugin-mcp` work with v5 and v6, so you can upgrade them separately.
