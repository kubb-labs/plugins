---
'@kubb/plugin-ts': major
---

`operations` now defaults to `'inline'`. Plugin-ts writes only the schema types, and clients, hooks, and mocks print each operation's types where they use them, such as `Options<{ body: Pet; path?: never }>`. On the DigitalOcean spec, output with `pluginFetch()` drops from 2.06 MB in 1,031 files to 1.34 MB in 741 files.

The per-operation types, such as `AddPetOptions`, `AddPetResponses`, and `AddPetStatus200`, are no longer generated. If your code imports them, for example `isResponseError<GetPetByIdResponses>(error)`, set the old default:

```ts
pluginTs({ operations: 'export' })
```

With a single output file, such as `output: { path: 'types.ts' }`, operation types stay exported, since that file also holds the schemas.

See [Migrate to v6](https://kubb.dev/extensions/kubb-labs/plugin-ts/guides/migrate-to-v6).
