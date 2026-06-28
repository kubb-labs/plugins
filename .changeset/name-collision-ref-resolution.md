---
"@kubb/plugin-ts": patch
"@kubb/plugin-zod": patch
"@kubb/plugin-faker": patch
---

Resolve type/schema references to their renamed target when a component name collides.

When two components share a name across sections or by case (e.g. `#/components/schemas/Order` and `#/components/requestBodies/Order`, or `Variant`/`variant`), the adapter disambiguates the emitted files (`OrderSchema`, `OrderRequest`, `Variant2`) and records the rename in a `nameMapping` keyed by the full `$ref` path. The printers previously emitted the un-disambiguated short name for the reference, producing a dangling reference such as `CreateOrderStatus201 = Order` with an `import { Order } from './Order.ts'` that no file satisfies (`TS2307`).

Each printer's `ref()` handler now resolves the referenced name through `nameMapping` (keyed by `node.ref`) before falling back to the short ref name, so the type reference and the generated component match. The generators plumb `nameMapping` from `ctx.meta`. This is a no-op for specs without colliding component names.

Requires `@kubb/adapter-oas` to expose `nameMapping` on `InputMeta` and resolve collision-renamed imports.
