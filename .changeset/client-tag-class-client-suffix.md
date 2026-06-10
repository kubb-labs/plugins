---
"@kubb/plugin-client": minor
---

Name tag classes with a `Client` suffix so class-based clients no longer collide with schema models in the barrel (kubb-labs/plugins#331).

When `clientType: 'class'`, `clientType: 'staticClass'`, or `sdk` generated a class per tag, the class was named after the tag (`Pet`, `Store`, `User`). The barrel then re-exported both the tag class and the schema model of the same name, so the output failed `tsc` with `TS2300: Duplicate identifier` (the Swagger petstore tag `pet` + schema `Pet` is the canonical case).

The default `resolver.resolveGroupName` now appends `Client`, so the tag `pet` produces `class PetClient` and the barrel emits `export type { Pet }` alongside `export { PetClient }` without conflict.

This changes the generated class names for existing class/`sdk` users that do not set `group`. To keep the old names, override the resolver (`this` is bound to the full resolver):

```ts
pluginClient({
  clientType: 'class',
  resolver: {
    resolveGroupName(name) {
      return this.resolveClassName(name)
    },
  },
})
```
