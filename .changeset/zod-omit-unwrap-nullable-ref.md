---
"@kubb/plugin-zod": patch
---

Fix `.omit()` being called on a `ZodNullable`/`ZodOptional` wrapper for request schemas built from a `$ref` to a nullable (or optional) component (kubb-labs/plugins#567, bug 4).

A `$ref` resolves to a named schema variable that already carries its own `.nullable()` / `.optional()` modifiers, but `.omit()` only exists on the inner `ZodObject`. When readonly keys were stripped from such a ref the printer emitted `mySchema.omit({ … })`, which fails strict typecheck with `Property 'omit' does not exist on type 'ZodNullable<…>'`. The printer now unwraps down to the object first and re-applies the modifier — `mySchema.unwrap().omit({ … }).nullable()` — mirroring plugin-ts emitting `Omit<NonNullable<T>, …>`. The same fix applies to the `zod/mini` printer.
