---
"@kubb/plugin-faker": minor
---

Remove the `mapper` option, matching the v5 removal on the other plugins. Use a macro to rewrite the property's schema before printing, or a printer override to change how a schema type renders.

Migration: replace a `mapper` entry with a macro that rewrites the property's schema, such as turning `status` into an enum of a subset of its spec values. The default printer then emits the same `faker.helpers.arrayElement([...])` call, typed against the plugin-ts output, so pick values the type allows.
