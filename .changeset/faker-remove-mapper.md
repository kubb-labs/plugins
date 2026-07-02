---
"@kubb/plugin-faker": minor
---

Remove the `mapper` option, matching the v5 removal on the other plugins. Use a macro to rewrite the property's schema before printing, or a printer override to change how a schema type renders.

Migration: replace `mapper: { status: "faker.helpers.arrayElement(['working', 'idle'])" }` with a macro that turns the `status` property into an enum of those values. The default printer then emits the same `faker.helpers.arrayElement([...])` call.
