---
'@kubb/plugin-ts': minor
'@kubb/plugin-zod': minor
'@kubb/plugin-faker': minor
'@kubb/plugin-msw': minor
'@kubb/plugin-client': minor
'@kubb/plugin-fetch': minor
'@kubb/plugin-axios': minor
'@kubb/plugin-react-query': minor
'@kubb/plugin-vue-query': minor
'@kubb/plugin-swr': minor
'@kubb/plugin-mcp': minor
'@kubb/plugin-cypress': minor
---

Nest a tag group in the folders of its OpenAPI 3.2 `parent` tags.

With `group: { type: 'tag' }`, a `payment` tag whose `parent` is `store` now writes to `store/payment/` instead of `payment/`. Tags without a `parent` keep their folder.

```diff
- import { listPayments } from './gen/clients/payment/listPayments'
+ import { listPayments } from './gen/clients/store/payment/listPayments'
```

Pass `group.name` to keep one folder per tag: `group: { type: 'tag', name: ({ group }) => group }`.
