# Migrate to v6

`@kubb/plugin-fetch` 6 removes the compatibility layer around the client runtime that `@kubb/plugin-client` ships. The fetch client keeps its API, so most projects only regenerate. Code that only calls the generated functions or hooks needs no change.

## Upgrade steps

1. Upgrade `kubb` and `@kubb/plugin-fetch` together. v6 needs the Kubb release that follows 5.15.4:

   ```bash
   npm install --save-dev kubb@latest @kubb/plugin-fetch@6
   ```

   While v6 is in beta, install `@kubb/plugin-fetch@beta` instead of `@6`.

2. Regenerate the client. This rewrites `.kubb/` and the operation files, so generated code needs no hand edits:

   ```bash
   npx kubb generate
   ```

3. Run the type checker. Each breaking change shows up as a compile error in your own code:

   ```bash
   npx tsc --noEmit
   ```

4. Fix each error with the matching section below.
5. Check the changes that do not fail the type checker, listed under [Behavior changes](#behavior-changes).

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

Code that imports from the generated `.kubb/client.ts` needs no change.

## Stream result types

`EventStreamResult`, `StreamResult`, and `UnwrappedStreamResult` take the full event type, not the payload. Wrap a payload in `ServerSentEvent`:

```typescript
// before
let result: EventStreamResult<PetEvent>

// after
let result: EventStreamResult<ServerSentEvent<PetEvent>>
```

A stream whose document names each event already used `TypedEvent<…>`, which stays the same.

## Behavior changes

These changes compile without errors, so check them by hand:

- A successful stream call with a body that is not a stream, such as a JSON body, throws a `TypeError` with the body as its `cause`. A successful answer with no body still ends as an empty stream.
- An event the server ends without a blank line is dropped, as browser `EventSource` does, so end every event with one.

## Query plugins

`@kubb/plugin-react-query`, `@kubb/plugin-vue-query`, `@kubb/plugin-swr`, and `@kubb/plugin-mcp` work with v5 and v6, so you can upgrade them separately.
