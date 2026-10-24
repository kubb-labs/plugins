---
'@kubb/plugin-ts': minor
---

Add `operationTypes` to `pluginTs`. Set it to `false` to drop the per-operation alias for a request body or response backed by a single `$ref`. The operation file re-exports the referenced type instead, and clients and query hooks reference it directly.

```ts
pluginTs({ operationTypes: false })
```

```diff
-mutationOptions<PlaceOrderStatus200, ResponseErrorConfig<PlaceOrderStatus405>, PlaceOrderOptions, TContext>
+mutationOptions<Order, ResponseErrorConfig<PlaceOrderStatus405>, PlaceOrderOptions, TContext>
```

The default, `true`, keeps the current output.
