---
"@kubb/plugin-zod": minor
---

Remove the `wrapOutput` option in favor of printer overrides. `wrapOutput` only fired on object property values, so it never wrapped top-level schemas (strings, enums, unions). A printer override with `this.base(node)` wraps any node type, including the whole schema (needs `@kubb/ast` 5.0.0-beta.80 or later).

Migration: move the wrapping into `printer.nodes` and call `this.base(node)` for the built-in output.

```ts
pluginZod({
  printer: {
    nodes: {
      object(node) {
        return `${this.base(node)}.openapi(${JSON.stringify({ description: node.description })})`
      },
    },
  },
})
```
