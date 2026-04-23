# Plan: Add `examples/sdk` example

## Goal

Create a new `examples/sdk` directory that demonstrates how to use `plugin-client` with `clientType: 'class'` to generate a typed SDK from an OpenAPI spec.

---

## Directory structure

```
examples/sdk/
├── kubb.config.ts
├── package.json
├── tsconfig.json
├── petStore.yaml        # copy from examples/client/petStore.yaml
└── src/
    └── index.ts         # SDK usage example
```

---

## Files to create

### `package.json`

- `name`: `"sdk-pet-store"`
- `scripts`: `generate`, `typecheck`
- `dependencies`: `@kubb/adapter-oas`, `@kubb/core`, `@kubb/plugin-client`, `@kubb/plugin-ts`, `kubb` — all from `catalog:` / `workspace:*`
- Match `engines` and `packageManager` from other examples

### `kubb.config.ts`

Configure a single Kubb run that generates a fully-typed SDK:

```ts
pluginTs({
  output: { path: 'models', barrelType: 'named' },
  group: { type: 'tag' },
})

pluginClient({
  output: { path: 'clients', barrelType: 'named' },
  client: 'fetch',
  clientType: 'class',           // generates per-tag classes
  group: { type: 'tag' },
  pathParamsType: 'object',
})
```

This produces per-tag class files: `PetController`, `StoreController`, `UserController`.

Use `done` hooks for linting (e.g. `done: ['oxlint --fix ./src']`) instead of `output.lint`.

### `tsconfig.json`

Copy from `examples/client/tsconfig.json` (same TS settings: `strict`, `moduleResolution: Bundler`, `allowImportingTsExtensions`). Remove JSX settings since there are no custom generators.

### `petStore.yaml`

Copy from `examples/client/petStore.yaml`.

### `src/index.ts`

Show how to instantiate and call the generated SDK classes:

```ts
import { PetController } from './gen/clients/petController/petController'

const petClient = new PetController({ baseURL: 'https://petstore3.swagger.io/api/v3' })

// petClient.getPetById(...)
// petClient.addPet(...)
```

---

## Workspace registration

`examples/sdk` is automatically picked up by the `examples/*` glob in `pnpm-workspace.yaml`. No changes needed there.

---

## Checklist

- [ ] Copy `petStore.yaml` from `examples/client/`
- [ ] Create `package.json`
- [ ] Create `kubb.config.ts`
- [ ] Create `tsconfig.json`
- [ ] Create `src/index.ts`
- [ ] Run `pnpm install` to register the new workspace package
- [ ] Run `pnpm generate` inside `examples/sdk` to verify code generation works
- [ ] Run `typecheck` to verify generated types are valid
