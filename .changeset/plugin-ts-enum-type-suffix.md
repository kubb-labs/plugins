---
"@kubb/plugin-ts": minor
---

Add `enumTypeSuffix` option to control the suffix on generated type aliases when `enumType` is `asConst` or `asPascalConst`.

```typescript
pluginTs({
  enumType: 'asConst',
  enumTypeSuffix: 'Value', // → export type PetTypeValue = …
})
```

Set `enumTypeSuffix: ''` to suppress the suffix. Defaults to `'Key'` for backwards compatibility.
