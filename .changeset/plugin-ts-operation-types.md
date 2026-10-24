---
'@kubb/plugin-ts': minor
'@kubb/plugin-client': patch
'@kubb/plugin-axios': patch
'@kubb/plugin-fetch': patch
'@kubb/plugin-cypress': patch
'@kubb/plugin-faker': patch
'@kubb/plugin-mcp': patch
'@kubb/plugin-msw': patch
'@kubb/plugin-react-query': patch
'@kubb/plugin-swr': patch
'@kubb/plugin-vue-query': patch
---

Add `operations` to `pluginTs`. Set it to `'inline'` to emit only the schema types: no per-operation file with `XxxOptions`, `XxxResponses`, or `XxxStatus200` aliases. Clients, query hooks, MSW handlers, Faker mocks, Cypress requests, and MCP handlers reference the schema types directly and print the rest inline.

```ts
pluginTs({ operations: 'inline' })
```

```diff
-import type { PlaceOrderOptions, PlaceOrderStatus200, PlaceOrderStatus405 } from '../../models/store/PlaceOrder'
+import type { Order } from '../../models/Order'
-mutationOptions<PlaceOrderStatus200, ResponseErrorConfig<PlaceOrderStatus405>, PlaceOrderOptions, TContext>
+mutationOptions<Order, ResponseErrorConfig<unknown>, { body?: Order; path?: never; query?: never; headers?: never }, TContext>
```

The default, `'export'`, keeps the current output.
