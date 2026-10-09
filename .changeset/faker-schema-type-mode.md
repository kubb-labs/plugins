---
'@kubb/plugin-faker': minor
---

Add `typeMode: 'schema'` to generate object factories that accept `Partial<Model>` overrides and return the declared model type. This allows fixtures to be modified according to the API model and rejects unknown properties in inline overrides. The default `'inferred'` mode preserves literal overrides and precise generated field types.
