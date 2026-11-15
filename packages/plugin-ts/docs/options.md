# Options

Pass these options to `pluginTs()`. Shared options link to [Shared plugin options](https://kubb.dev/docs/5.x/reference/plugin-options), and this page gives only their default here.

## Options overview

| Option                                                                    | Purpose                                                                              | Default                                                                               |
| ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------- |
| [`output`](https://kubb.dev/docs/5.x/reference/plugin-options#output)     | Where files are written: `path`, `mode`, `barrel`, `banner`, `footer`.               | `{ path: 'types', barrel: { type: 'named' } }`                                        |
| [`group`](https://kubb.dev/docs/5.x/reference/plugin-options#group)       | Split output by tag or path.                                                         | None                                                                                  |
| [`enum`](#enum)                                                           | How enums are generated and named.                                                   | `{ type: 'asConst', constCasing: 'camelCase', typeSuffix: 'Key', keyCasing: 'none' }` |
| ↳ [`enum.type`](#enumtype)                                                | Representation of each enum.                                                         | `'asConst'`                                                                           |
| ↳ [`enum.constCasing`](#enumconstcasing)                                  | Casing of the `as const` object.                                                     | `'camelCase'`                                                                         |
| ↳ [`enum.typeSuffix`](#enumtypesuffix)                                    | Suffix of the companion type.                                                        | `'Key'`                                                                               |
| ↳ [`enum.keyCasing`](#enumkeycasing)                                      | Casing of enum keys.                                                                 | `'none'`                                                                              |
| [`syntaxType`](#syntaxtype)                                               | Type aliases or interfaces for object schemas.                                       | `'type'`                                                                              |
| [`optionalType`](#optionaltype)                                           | How optional properties are written.                                                 | `'questionToken'`                                                                     |
| [`arrayType`](#arraytype)                                                 | `Type[]` or `Array<Type>`.                                                           | `'array'`                                                                             |
| [`operations`](#operations)                                               | Per-operation type files, or inline types in consumers.                              | `'export'`                                                                            |
| [`printer`](#printer)                                                     | Replace the handler for a schema type.                                               | None                                                                                  |
| [`include`](https://kubb.dev/docs/5.x/reference/plugin-options#include)   | Keep only operations and schemas that match.                                         | None                                                                                  |
| [`exclude`](https://kubb.dev/docs/5.x/reference/plugin-options#exclude)   | Skip operations and schemas that match.                                              | `[]`                                                                                  |
| [`override`](https://kubb.dev/docs/5.x/reference/plugin-options#override) | Apply different options per pattern.                                                 | `[]`                                                                                  |
| [`resolver`](https://kubb.dev/docs/5.x/reference/plugin-options#resolver) | Customize generated names and file paths. See [resolver members](#resolver-members). | `resolverTs`                                                                          |
| [`macros`](https://kubb.dev/docs/5.x/reference/plugin-options#macros)     | Rewrite AST nodes before printing.                                                   | `[]`                                                                                  |

## Option details

### enum

How OpenAPI enums are represented in the generated TypeScript, and how their names are cased.

|          |                                                                                       |
| -------- | ------------------------------------------------------------------------------------- |
| Type     | `{ type?, constCasing?, typeSuffix?, keyCasing? }`                                    |
| Required | `false`                                                                               |
| Default  | `{ type: 'asConst', constCasing: 'camelCase', typeSuffix: 'Key', keyCasing: 'none' }` |

Which fields apply depends on `type`:

| `type`                         | `constCasing` | `typeSuffix` | `keyCasing`     |
| ------------------------------ | ------------- | ------------ | --------------- |
| `'asConst'`                    | Yes           | Yes          | Yes             |
| `'enum'`, `'constEnum'`        | No            | No           | Yes             |
| `'literal'`, `'inlineLiteral'` | No            | No           | No, values only |

#### enum.type

Representation of each enum.

|          |                                                                      |
| -------- | -------------------------------------------------------------------- |
| Type     | `'asConst' \| 'enum' \| 'constEnum' \| 'literal' \| 'inlineLiteral'` |
| Required | `false`                                                              |
| Default  | `'asConst'`                                                          |

::field-group

:::field{name="'asConst'"}
Writes an `as const` object and a union type of its values. Bundlers drop the object when nothing uses it.
:::

:::field{name="'enum'"}
Writes a TypeScript `enum`, which has JavaScript runtime code.
:::

:::field{name="'constEnum'"}
Writes a `const enum`, inlined at compile time. With `--isolatedModules`, code can use it from the generated source, but not through a `.d.ts` file, such as the types of a published package.
:::

:::field{name="'literal'"}
Writes a named union type with no runtime value.
:::

:::field{name="'inlineLiteral'"}
Writes the same union as `'literal'` and inlines it at each use for an enum declared on a property. A component enum that a `$ref` points to keeps its named type.
:::

::

::code-group

```typescript ['asConst' (default)]
export const petStatus = {
  available: 'available',
  pending: 'pending',
  sold: 'sold',
} as const

export type PetStatusKey = (typeof petStatus)[keyof typeof petStatus]
```

```typescript ['enum']
export enum PetStatus {
  available = 'available',
  pending = 'pending',
  sold = 'sold',
}
```

```typescript ['literal']
export type PetStatus = 'available' | 'pending' | 'sold'
```

::

#### enum.constCasing

Casing of the const object when `type` is `'asConst'`.

|          |                               |
| -------- | ----------------------------- |
| Type     | `'camelCase' \| 'pascalCase'` |
| Required | `false`                       |
| Default  | `'camelCase'`                 |

::field-group

:::field{name="'camelCase'"}
Names the const `petStatus`.
:::

:::field{name="'pascalCase'"}
Names the const `PetStatus`, the same as the schema.
:::

::

#### enum.typeSuffix

Suffix on the companion type when `type` is `'asConst'`. It never changes the const object name. `''` drops the suffix, and with `constCasing: 'pascalCase'` the const and the type then share one name, `PetStatus`.

|          |          |
| -------- | -------- |
| Type     | `string` |
| Required | `false`  |
| Default  | `'Key'`  |

```typescript [typeSuffix: 'Value']
export type PetStatusValue = (typeof petStatus)[keyof typeof petStatus]
```

#### enum.keyCasing

Casing of enum key names.

|          |                                                                                |
| -------- | ------------------------------------------------------------------------------ |
| Type     | `'none' \| 'camelCase' \| 'pascalCase' \| 'snakeCase' \| 'screamingSnakeCase'` |
| Required | `false`                                                                        |
| Default  | `'none'`                                                                       |

For the enum value `enum value`, each casing writes this key:

::field-group

:::field{name="'none'"}
Keeps the raw value from the spec.
:::

:::field{name="'camelCase'"}
Writes `enumValue`.
:::

:::field{name="'pascalCase'"}
Writes `EnumValue`.
:::

:::field{name="'snakeCase'"}
Writes `enum_value`.
:::

:::field{name="'screamingSnakeCase'"}
Writes `ENUM_VALUE`.
:::

::

### syntaxType

How object schemas are declared.

|          |                         |
| -------- | ----------------------- |
| Type     | `'type' \| 'interface'` |
| Required | `false`                 |
| Default  | `'type'`                |

::field-group

:::field{name="'type'"}
Writes `export type Pet = { name: string }`.
:::

:::field{name="'interface'"}
Writes `export interface Pet { name: string }`. Use it when consumers need declaration merging. See [Type vs Interface](https://www.totaltypescript.com/type-vs-interface-which-should-you-use).
:::

::

### optionalType

How optional properties are written.

|          |                                                                 |
| -------- | --------------------------------------------------------------- |
| Type     | `'questionToken' \| 'undefined' \| 'questionTokenAndUndefined'` |
| Required | `false`                                                         |
| Default  | `'questionToken'`                                               |

::field-group

:::field{name="'questionToken'"}
Writes `type?: string`. The property may be missing.
:::

:::field{name="'undefined'"}
Writes `type: string | undefined`. The property must exist but may be `undefined`.
:::

:::field{name="'questionTokenAndUndefined'"}
Writes `type?: string | undefined`, so the property may be missing or `undefined`. Use it with `"exactOptionalPropertyTypes": true`.
:::

::

### arrayType

Syntax for array types.

|          |                        |
| -------- | ---------------------- |
| Type     | `'array' \| 'generic'` |
| Required | `false`                |
| Default  | `'array'`              |

::field-group

:::field{name="'array'"}
Writes `tags: string[]`.
:::

:::field{name="'generic'"}
Writes `tags: Array<string>`, which reads better for elements like `Array<{ id: number }>`.
:::

::

### operations

Whether each operation gets its own types file, with types such as `AddPetOptions`, `AddPetResponses`, `AddPetStatus200`, and `AddPetPath`. A response that declares `headers` also gets a type such as `ListPetsStatus200Headers`, and cookie parameters get one such as `ListPetsCookies`.

|          |                        |
| -------- | ---------------------- |
| Type     | `'export' \| 'inline'` |
| Required | `false`                |
| Default  | `'export'`             |

::field-group

:::field{name="'export'"}
Writes one file per operation with its aliases and aggregates, such as `export type AddPetStatus200 = Pet`. When an operation file would have the same name as a schema file, ignoring case, it gets an `Operation` suffix: operation `point` goes to `PointOperation.ts` next to schema `Point.ts`. `plugin-zod` and `plugin-faker` name their operation files the same way.
:::

:::field{name="'inline'"}
Writes only the schema types. Clients, query hooks, MSW handlers, Faker mocks, Cypress requests, and MCP handlers reference those directly and print the rest inline, such as `Options<{ body: Order; path?: never; query?: never; headers?: never }>`. An enum declared inside an operation becomes a literal union such as `'available' | 'pending' | 'sold'`. Kubb moves each operation type into the files that use it, so `'inline'` needs a Kubb version with inline sources.
:::

::

### printer

Replaces the handler for a schema type such as `'integer'` or `'date'`. Each handler returns the TypeScript type as a string. Inside a handler, `this.transform(node)` returns the printed type of a nested node, and `this.options` holds the printer options. The [printer guide](https://kubb.dev/docs/5.x/how-to/customize#printers) covers the handler context and how overrides compose with macros.

|          |                              |
| -------- | ---------------------------- |
| Type     | `{ nodes?: PrinterTsNodes }` |
| Required | `false`                      |

A handler that returns a TypeScript compiler node is deprecated. See [Map schema types](https://kubb.dev/extensions/kubb-labs/plugin-ts/guides/customization#map-schema-types) for an example.

## Resolver members

A `resolver` patch overrides generated names. Members you leave out keep `resolverTs`. Next to the shared `name`, `file`, and `imports` members described under [`resolver`](https://kubb.dev/docs/5.x/reference/plugin-options#resolver), `resolverTs` has these:

::code-collapse{name="ResolverTs patch members"}

```typescript [Partial override]
type ResolverTsPatch = {
  param?: {
    name?(node: OperationNode, param: ParameterNode): string    // → 'DeletePetPathPetId'
    path?(node: OperationNode, param: ParameterNode): string     // → 'GetPetByIdPath'
    query?(node: OperationNode, param: ParameterNode): string    // → 'FindPetsByStatusQuery'
    headers?(node: OperationNode, param: ParameterNode): string  // → 'DeletePetHeaders'
    cookies?(node: OperationNode, param: ParameterNode): string  // → 'GetCookiesCookies'
  }
  response?: {
    status?(node: OperationNode, statusCode: StatusCode): string // → 'ListPetsStatus200'
    headers?(node: OperationNode, statusCode: StatusCode): string // → 'ListPetsStatus200Headers'
    options?(node: OperationNode): string                        // → 'ListPetsOptions'
    responses?(node: OperationNode): string                      // → 'ListPetsResponses'
    response?(node: OperationNode): string                       // → 'ListPetsResponse'
    body?(node: OperationNode): string                           // → 'CreatePetBody'
  }
  enum?: {
    keyName?(node: { name?: string | null }, enumTypeSuffix?: string): string // → 'PetStatusKey'
  }
}
```

::
