---
'@kubb/plugin-ts': major
---

`operations` now defaults to `'inline'`: `@kubb/plugin-ts` writes only the schema types, and clients, hooks, and mocks print operation types where they use them. To keep importing types such as `AddPetResponses`, set `pluginTs({ operations: 'export' })`. See [Migrate to v6](https://kubb.dev/extensions/kubb-labs/plugin-ts/guides/migrate-to-v6).
