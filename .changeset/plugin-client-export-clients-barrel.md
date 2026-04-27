---
"@kubb/plugin-client": minor
---

Always inject `.kubb/client.ts` into generated output so the fetch/axios client is part of the barrel.

Previously the client file was only written when `bundle: true`. Now it is always written:

- **`bundle: false` (default)** — `.kubb/client.ts` re-exports everything from `@kubb/plugin-client/clients/{client}`, so the generated barrel exposes the client without bundling it locally.
- **`bundle: true`** — `.kubb/client.ts` contains the full inline source as before.

The file is marked `isIndexable: true` so kubb's barrel generator includes it in the output `index.ts`.

The internal file name was also renamed from `.kubb/fetch.ts` to `.kubb/client.ts` to be neutral across both `fetch` and `axios` client types.

Additionally, `axiosClient` and `fetchClient` are now exported as named namespace exports from the `@kubb/plugin-client` package barrel:

```ts
import { fetchClient, axiosClient } from '@kubb/plugin-client'
```
