---
'@kubb/plugin-ts': minor
'@kubb/plugin-cypress': patch
'@kubb/plugin-faker': patch
'@kubb/plugin-msw': patch
'@kubb/plugin-react-query': patch
'@kubb/plugin-swr': patch
'@kubb/plugin-vue-query': patch
---

Add `operationTypes` to `pluginTs`. Set it to `false` to drop the per-operation alias for a request body or response backed by a single `$ref`. Query hooks, MSW handlers, Faker mocks, and Cypress requests then import the referenced type from its own file. A response without a body resolves to `unknown` instead of an alias.

```ts
pluginTs({ operationTypes: false })
```

```diff
-import type { PlaceOrderOptions, PlaceOrderStatus200, PlaceOrderStatus405 } from '../../models/store/PlaceOrder'
+import type { Order } from '../../models/Order'
+import type { PlaceOrderOptions } from '../../models/store/PlaceOrder'
-mutationOptions<PlaceOrderStatus200, ResponseErrorConfig<PlaceOrderStatus405>, PlaceOrderOptions, TContext>
+mutationOptions<Order, ResponseErrorConfig<unknown>, PlaceOrderOptions, TContext>
```

The default, `true`, keeps the current output.
