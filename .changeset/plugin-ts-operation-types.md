---
'@kubb/plugin-ts': minor
---

Add `operations` to `pluginTs`. Set it to `'inline'` to emit only the schema types: no per-operation file with `XxxOptions`, `XxxResponses`, or `XxxStatus200` aliases. Clients, query hooks, MSW handlers, Faker mocks, Cypress requests, and MCP handlers reference the schema types directly and print the rest inline. It needs the Kubb release with inline sources ([kubb-labs/kubb#4438](https://github.com/kubb-labs/kubb/pull/4438)).

```ts
pluginTs({ operations: 'inline' })
```

```diff
-import type { PlaceOrderOptions, PlaceOrderStatus200, PlaceOrderStatus405 } from '../../models/store/PlaceOrder'
+import type { Order } from '../../models/Order'
-mutationOptions<PlaceOrderStatus200, ResponseErrorConfig<PlaceOrderStatus405>, PlaceOrderOptions, TContext>
+mutationOptions<Order, ResponseErrorConfig<unknown>, { body: Order; path?: never; query?: never; headers?: never }, TContext>
```

The default, `'export'`, keeps the current output.
