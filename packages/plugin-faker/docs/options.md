# Options

Pass these options to `pluginFaker()`, all of them optional. Shared options link to [Shared plugin options](https://kubb.dev/docs/5.x/reference/plugin-options).

## Options overview

| Option                                                                    | Purpose                                                                     | Default                                        |
| ------------------------------------------------------------------------- | --------------------------------------------------------------------------- | ---------------------------------------------- |
| [`output`](https://kubb.dev/docs/5.x/reference/plugin-options#output)     | Where files are written: `path`, `mode`, `barrel`, `banner`, `footer`.      | `{ path: 'mocks', barrel: { type: 'named' } }` |
| [`group`](https://kubb.dev/docs/5.x/reference/plugin-options#group)       | Split output by tag or path: `type`, `name`.                                | None                                           |
| [`typeMode`](#typemode)                                                   | Whether factory types come from the generated values or the declared model. | `'inferred'`                                   |
| [`dateParser`](#dateparser)                                               | Library that formats string date and time fields.                           | `'faker'`                                      |
| [`regexGenerator`](#regexgenerator)                                       | Library that turns a regex `pattern` into a string.                         | `'faker'`                                      |
| [`locale`](#locale)                                                       | Faker locale code for the generated values.                                 | `'en'`                                         |
| [`seed`](#seed)                                                           | Value passed to `faker.seed(...)` for deterministic output.                 | None                                           |
| [`include`](https://kubb.dev/docs/5.x/reference/plugin-options#include)   | Keep only operations and schemas that match.                                | None                                           |
| [`exclude`](https://kubb.dev/docs/5.x/reference/plugin-options#exclude)   | Skip operations and schemas that match.                                     | `[]`                                           |
| [`override`](https://kubb.dev/docs/5.x/reference/plugin-options#override) | Apply different options per pattern.                                        | `[]`                                           |
| [`resolver`](#resolver)                                                   | Customize generated names and file paths.                                   | `resolverFaker`                                |
| [`macros`](https://kubb.dev/docs/5.x/reference/plugin-options#macros)     | Rewrite AST nodes before printing.                                          | `[]`                                           |
| [`printer`](#printer)                                                     | Replace the handler for a schema type.                                      | None                                           |

## Option details

### typeMode

Controls the input and return types of object and intersection factories. Both modes generate the same values and apply overrides with a shallow merge.

|          |                          |
| -------- | ------------------------ |
| Type     | `'inferred' \| 'schema'` |
| Required | `false`                  |
| Default  | `'inferred'`             |

::field-group

:::field{name="'inferred'"}
Default value. Derives return types from generated values and supplied overrides. Optional and nullable fields retain their concrete value types, and overrides preserve literal types.

Factories in a schema cycle use the declared model as their base return type to avoid circular TypeScript inference. Supplied overrides still preserve their types.
:::

:::field{name="'schema'"}
Accepts `Partial<Model>` and returns the declared model type, including optional and nullable fields. Use it for fixtures that change after creation.
:::

::

::code-group

```typescript ['inferred' (default)]
// export function createOrder<TData extends Partial<Order> = object>(data?: TData)
const order = createOrder({ quantity: 2, complete: true })
const complete: true = order.complete

// TypeScript error: false is not assignable to true.
order.complete = false
```

```typescript ['schema']
// export function createOrder(data?: Partial<Order>): Order
const order = createOrder({ quantity: 2, complete: true })
order.complete = false

// TypeScript error: foo does not exist in Partial<Order>.
createOrder({ quantity: 2, foo: '' })
```

::

Use [`override`](https://kubb.dev/docs/5.x/reference/plugin-options#override) to select a mode for matching schemas. String patterns are regular expressions, so `'^Order$'` matches only the `Order` schema:

```typescript [kubb.config.ts]
pluginFaker({
  override: [{ type: 'schemaName', pattern: '^Order$', options: { typeMode: 'schema' } }],
})
```

### dateParser

Library used to format `date`, `time`, and `date-time` fields represented as strings. Pick a value other than `'faker'` when the project already uses a date library, and install that library in the consuming app.

Generated `date` and `time` strings use `YYYY-MM-DD` and `HH:mm:ss`. A `date-time` string is `toISOString()` output with `'faker'`. Any other parser formats it as `YYYY-MM-DDTHH:mm:ss[Z]`, without the `Z` for a local date-time and with a numeric offset when the schema declares one.

|          |                                            |
| -------- | ------------------------------------------ |
| Type     | `'faker' \| 'dayjs' \| 'moment' \| string` |
| Required | `false`                                    |
| Default  | `'faker'`                                  |

::field-group

:::field{name="'faker'"}
Default value. Renders a `date` field as `faker.date.anytime().toISOString().substring(0, 10)`.
:::

:::field{name="'dayjs'"}
Renders it as `dayjs(faker.date.anytime()).format('YYYY-MM-DD')`.
:::

:::field{name="'moment'"}
Renders it as `moment(faker.date.anytime()).format('YYYY-MM-DD')`.
:::

:::field{name="Custom module"}
Pass the name of a module whose default export has the dayjs API, because generated code calls `name(faker.date.anytime()).format('YYYY-MM-DD')`. Kubb imports the default export under the camelCased module name, so `'my-date-lib'` becomes `myDateLib` and `'@scope/lib'` becomes `scopeLib`.
:::

::

### regexGenerator

Library used to generate strings that satisfy a regex `pattern` in the spec.

|          |                        |
| -------- | ---------------------- |
| Type     | `'faker' \| 'randexp'` |
| Required | `false`                |
| Default  | `'faker'`              |

::field-group

:::field{name="'faker'"}
Default value. Generates `faker.helpers.fromRegExp(/pattern/)` without an extra dependency. Kubb rewrites `\d`, `\w`, escaped characters such as `\+`, and open-ended counts such as `{1,}` into a form faker reads. Faker does not support groups, alternation (`a|b`), or `\s`, so use `'randexp'` for patterns that contain them.
:::

:::field{name="'randexp'"}
Generates `new RandExp(pattern).gen()`. Supports a wider regex grammar and needs `randexp` installed in the consuming app.
:::

::

### locale

Faker locale code. It switches the named import to `fakerXX` from `@faker-js/faker`, so generated values reflect the target region. The default `'en'` imports `fakerEN`, `'de'` imports `fakerDE`, and `'de_AT'` imports `fakerDE_AT`. See [Faker.js localization](https://fakerjs.dev/api/localization.html) for all locale codes.

|          |          |
| -------- | -------- |
| Type     | `string` |
| Required | `false`  |
| Default  | `'en'`   |

### seed

Kubb passes this value to `faker.seed(...)` once at the top of each generated file, so every run returns the same sequence of data. A second call to the same factory returns the next values in that sequence. Use it for snapshot tests. Pass a single number or an array of numbers. Factories still accept overrides, such as `createPet({ name: 'Rex' })`.

|          |                      |
| -------- | -------------------- |
| Type     | `number \| number[]` |
| Required | `false`              |

### resolver

Overrides generated file and symbol names. Omitted members keep `resolverFaker`. The shared members (`name`, `file`, `imports`) and the `this` context are described under [`resolver`](https://kubb.dev/docs/5.x/reference/plugin-options#resolver).

|          |                                |
| -------- | ------------------------------ |
| Type     | `ResolverPatch<ResolverFaker>` |
| Required | `false`                        |

::code-collapse{name="ResolverFaker patch members"}

```typescript [Partial override]
type ResolverFakerPatch = {
  name?(name: string): string
  file?: {
    baseName?(params: { name: string; extname: string }): string
    path?(params: { baseName: string; output: Output }): string
  }
  imports?(options: ResolveImportsOptions): Array<ImportNode>
  param?: {
    name?(node: OperationNode, param: ParameterNode): string    // → 'createShowPetByIdPathPetId'
    path?(node: OperationNode, param: ParameterNode): string     // → 'createShowPetByIdPath'
    query?(node: OperationNode, param: ParameterNode): string    // → 'createListPetsQuery'
    headers?(node: OperationNode, param: ParameterNode): string  // → 'createDeletePetHeaders'
    cookies?(node: OperationNode, param: ParameterNode): string  // → 'createGetSessionCookies'
  }
  response?: {
    status?(node: OperationNode, statusCode: StatusCode): string // → 'createListPetsStatus200'
    body?(node: OperationNode): string                           // → 'createCreatePetsBody'
    response?(node: OperationNode): string                       // → 'createListPetsResponse'
    responses?(node: OperationNode): string                      // → 'createListPetsResponses'
  }
}
```

::

### printer

Replaces the Faker node handler for a specific schema type, such as `'integer'`, `'date'`, or `'string'`. Each handler returns the Faker expression as a string. Use `this.transform` to recurse into nested nodes and `this.options` to read printer options. The [printer guide](https://kubb.dev/docs/5.x/how-to/printers) covers how overrides compose with macros.

|          |                                 |
| -------- | ------------------------------- |
| Type     | `{ nodes?: PrinterFakerNodes }` |
| Required | `false`                         |

```typescript [Map integer schemas to a float]
import { pluginFaker } from '@kubb/plugin-faker'

pluginFaker({
  printer: {
    nodes: {
      integer() {
        return 'faker.number.float()'
      },
    },
  },
})
```
