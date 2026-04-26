---
"@kubb/plugin-client": minor
---

Export `axiosClient` and `fetchClient` as named namespace exports from the main barrel file.

Both client implementations are now importable directly from `@kubb/plugin-client` in addition to the existing subpath imports:

```ts
import { fetchClient, axiosClient } from '@kubb/plugin-client'
```
