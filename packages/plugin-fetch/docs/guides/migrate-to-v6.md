# Migrate to v6

`@kubb/plugin-fetch` 6 removes the compatibility layer around the client runtime that `@kubb/plugin-client` ships. The fetch client keeps its API, so most projects only regenerate. Code that only calls the generated functions or hooks needs no change.

## Upgrade steps

1. Upgrade `kubb` and `@kubb/plugin-fetch` together. v6 needs Kubb 5.16.0 or later:

   ```bash
   npm install --save-dev kubb@latest @kubb/plugin-fetch@6
   ```

2. Regenerate the client. This rewrites `.kubb/` and the operation files, so generated code needs no hand edits:

   ```bash
   npx kubb generate
   ```

3. Run the type checker. Each breaking change shows up as a compile error in your own code:

   ```bash
   npx tsc --noEmit
   ```

4. Fix each error with the matching section below.
5. Coming from 5.12 or earlier, also check the changes listed under [From 5.12 or earlier](#from-5-12-or-earlier).

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

The package exports `templates/client.ts` for its types only. The runtime is the generated `.kubb/client.ts`. Code that imports from it needs no change, except for `FetchOptions`.

## Removed exports

`FetchOptions` is removed. The `options` type is `NativeOptions`, which is `RequestInit` plus Next.js's `next`:

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

A stream whose document names each event already used `TypedEvent<…>`, which stays the same.

## From 5.12 or earlier

5.13 already changed these, and they compile without errors, so check them by hand:

- A successful stream call with a body that is not a stream, such as a JSON body, throws a `TypeError` with the body as its `cause`. A successful answer with no body still ends as an empty stream.
- An event the server ends without a blank line is dropped, as browser `EventSource` does, so end every event with one.

## Query plugins

`@kubb/plugin-react-query`, `@kubb/plugin-vue-query`, `@kubb/plugin-swr`, and `@kubb/plugin-mcp` work with v5 and v6, so you can upgrade them separately.
