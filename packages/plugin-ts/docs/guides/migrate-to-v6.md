# Migrate to v6

Upgrade `@kubb/plugin-ts` from v5 to v6, which writes each operation's types inline where clients, hooks, and mocks use them, instead of in a types file per operation.

Code that only calls the generated functions or hooks needs a regenerate. Code that imports an operation type, such as `AddPetResponses` or `GetPetByIdStatus200`, needs the edit below.

## Upgrade steps

::steps{level="3"}

### Upgrade the packages

Upgrade `kubb` and `@kubb/plugin-ts` together. v6 needs Kubb 5.27.1 or later:

```bash
npm install --save-dev kubb@latest @kubb/plugin-ts@6
```

### Regenerate

This removes the per-operation type files:

```bash
npx kubb generate
```

### Run the type checker

An import of a removed operation type shows up as a compile error:

```bash
npx tsc --noEmit
```

### Fix each error

Find its row in [What to change](#what-to-change). Then check the [behavior changes](#behavior-changes), which compile without errors.

::

## What to change

| You used                                                                                            | Now                                                                                                                                                                     |
| --------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| An operation type, such as `AddPetOptions`, `AddPetResponses`, or `GetPetByIdStatus200`             | Import the schema type, such as `Pet`, or set [`operations: 'export'`](https://kubb.dev/extensions/kubb-labs/plugin-ts/options#operations) to keep the operation types. |
| A responses type passed to `isResponseError`, such as `isResponseError<GetPetByIdResponses>(error)` | Set `operations: 'export'`. Inline mode has no named responses type.                                                                                                    |
| A per-operation file, such as `types/pet/AddPet.ts`                                                 | Removed. Set `operations: 'export'` to write it again.                                                                                                                  |
| The `examples` option of a custom printer                                                           | Removed. A type no longer carries the `@example` of its whole schema.                                                                                                   |

To keep the v5 output, set the old default:

```typescript [kubb.config.ts]
pluginTs({ operations: 'export' })
```

## Behavior changes

These compile without errors:

| Area     | v5                                                                          | v6                                                                                                                       |
| -------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Output   | One types file per operation.                                               | Only schema types. With a single output file, such as `output: { path: 'types.ts' }`, operation types stay exported.     |
| Names    | An inlined schema could share a name with a type the file already uses.     | It gets an alias, such as `Options2` next to the client's `Options`, or `Response2` next to the fetch `Response`.        |
| Enums    | An enum declared inside an operation got its own declaration.               | It becomes a literal union in inline mode.                                                                               |
| Headers  | Each status code repeated its response headers type.                        | A status code with the same headers as an earlier one aliases it: `ListPetsStatus429Headers = ListPetsStatus200Headers`. |
| Comments | Property comments ended with `@type`, such as `@type integer \| undefined`. | No `@type` tag.                                                                                                          |
| Comments | A type carried the `@example` of its whole schema or response body.         | Only properties carry `@example`.                                                                                        |
