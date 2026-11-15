# Options

Pass these options to `pluginFaker()`. All of them are optional. Shared options link to [Shared plugin options](https://kubb.dev/docs/5.x/reference/plugin-options), and this page gives only their default here.

## Options overview

| Option                                                                    | Purpose                                                                              | Default                                        |
| ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------- |
| [`output`](https://kubb.dev/docs/5.x/reference/plugin-options#output)     | Where files are written: `path`, `mode`, `barrel`, `banner`, `footer`.               | `{ path: 'mocks', barrel: { type: 'named' } }` |
| [`group`](https://kubb.dev/docs/5.x/reference/plugin-options#group)       | Split output by tag or path.                                                         | None                                           |
| [`typeMode`](#typemode)                                                   | Factory types from the generated values or the declared model.                       | `'inferred'`                                   |
| [`dateParser`](#dateparser)                                               | Library that formats string date and time fields.                                    | `'faker'`                                      |
| [`regexGenerator`](#regexgenerator)                                       | Library that turns a regex `pattern` into a string.                                  | `'faker'`                                      |
| [`locale`](#locale)                                                       | Faker locale of the generated values.                                                | `'en'`                                         |
| [`seed`](#seed)                                                           | Value passed to `faker.seed(...)` for repeatable output.                             | None                                           |
| [`printer`](#printer)                                                     | Replace the handler for a schema type.                                               | None                                           |
| [`include`](https://kubb.dev/docs/5.x/reference/plugin-options#include)   | Keep only operations and schemas that match.                                         | None                                           |
| [`exclude`](https://kubb.dev/docs/5.x/reference/plugin-options#exclude)   | Skip operations and schemas that match.                                              | `[]`                                           |
| [`override`](https://kubb.dev/docs/5.x/reference/plugin-options#override) | Apply different options per pattern.                                                 | `[]`                                           |
| [`resolver`](https://kubb.dev/docs/5.x/reference/plugin-options#resolver) | Customize generated names and file paths. See [resolver members](#resolver-members). | `resolverFaker`                                |
| [`macros`](https://kubb.dev/docs/5.x/reference/plugin-options#macros)     | Rewrite AST nodes before printing.                                                   | `[]`                                           |

## Option details

### typeMode

Sets the input and return types of object and intersection factories. Both modes generate the same values and apply overrides with a shallow merge.

|          |                          |
| -------- | ------------------------ |
| Type     | `'inferred' \| 'schema'` |
| Required | `false`                  |
| Default  | `'inferred'`             |

::field-group

:::field{name="'inferred'"}
The factory takes any `Partial<Model>` and keeps its literal types. It returns the generated value types, merged with the override types. Optional and nullable fields keep their concrete value types.
:::

:::field{name="'schema'"}
The factory takes a `Partial<Model>` and returns the declared model type, with optional and nullable fields. Use it for fixtures you change after creation.
:::

::

Factories in a schema cycle use the declared model as their base return type with `'inferred'` too, so TypeScript does not infer in a circle. Overrides still keep their types.

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

To pick a mode for some schemas only, use [`override`](https://kubb.dev/docs/5.x/reference/plugin-options#override). String patterns are regular expressions, so `'^Order$'` matches only the `Order` schema:

```typescript [kubb.config.ts]
pluginFaker({
  override: [{ type: 'schemaName', pattern: '^Order$', options: { typeMode: 'schema' } }],
})
```

### dateParser

Library that formats `date`, `time`, and `date-time` fields typed as strings. Pick another value than `'faker'` when the project already uses a date library, and install that library in the app.

|          |                                            |
| -------- | ------------------------------------------ |
| Type     | `'faker' \| 'dayjs' \| 'moment' \| string` |
| Required | `false`                                    |
| Default  | `'faker'`                                  |

::field-group

:::field{name="'faker'"}
Renders a `date` field as `faker.date.anytime().toISOString().substring(0, 10)`.
:::

:::field{name="'dayjs'"}
Renders a `date` field as `dayjs(faker.date.anytime()).format("YYYY-MM-DD")`.
:::

:::field{name="'moment'"}
Renders a `date` field as `moment(faker.date.anytime()).format("YYYY-MM-DD")`.
:::

::

- `date` and `time` strings use `YYYY-MM-DD` and `HH:mm:ss`.
- A `date-time` string is `toISOString()` output with `'faker'`. Any other parser formats it as `YYYY-MM-DDTHH:mm:ss[Z]`, without the `Z` for a local date-time and with a numeric offset when the schema declares one.
- Any other module name renders a `date` field as `name(faker.date.anytime()).format("YYYY-MM-DD")`. The module needs a default export with the dayjs API. Kubb imports it under the camelCased module name, so `'my-date-lib'` becomes `myDateLib` and `'@scope/lib'` becomes `scopeLib`.
- A value other than `'faker'` fails generation when the adapter types dates as `Date`, such as with `dateType: 'date'`.

### regexGenerator

Library that generates strings matching a regex `pattern` in the spec.

|          |                        |
| -------- | ---------------------- |
| Type     | `'faker' \| 'randexp'` |
| Required | `false`                |
| Default  | `'faker'`              |

::field-group

:::field{name="'faker'"}
Writes `faker.helpers.fromRegExp(/pattern/)` and needs no extra dependency. Kubb rewrites `\d`, `\w`, escaped characters such as `\+`, and open-ended counts such as `{1,}` into a form faker reads. Faker does not support groups, alternation (`a|b`), or `\s`.
:::

:::field{name="'randexp'"}
Writes `new RandExp(pattern).gen()`, which supports a wider regex grammar. Needs `randexp` in the app.
:::

::

### locale

Faker locale code. Kubb imports the matching `fakerXX` export from `@faker-js/faker` as `faker`, so generated values fit the target region. See [Faker.js localization](https://fakerjs.dev/api/localization.html) for all codes.

|          |          |
| -------- | -------- |
| Type     | `string` |
| Required | `false`  |
| Default  | `'en'`   |

| Value            | Import                                               |
| ---------------- | ---------------------------------------------------- |
| `'en'` (default) | `import { fakerEN as faker } from '@faker-js/faker'` |
| `'de'`           | `fakerDE`                                            |
| `'de_AT'`        | `fakerDE_AT`                                         |

### seed

Kubb calls `faker.seed(...)` with this value once at the top of each generated file, so every run returns the same sequence of data. A second call to the same factory returns the next values in that sequence. Use it for snapshot tests.

|          |                      |
| -------- | -------------------- |
| Type     | `number \| number[]` |
| Required | `false`              |

### printer

Replaces the Faker handler for a schema type, such as `'integer'`, `'date'`, or `'string'`. Each handler returns the Faker expression as a string. Use `this.transform` to recurse into nested nodes and `this.options` to read the printer options. The [printer guide](https://kubb.dev/docs/5.x/how-to/customize#printers) covers how overrides compose with macros.

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

## Resolver members

A `resolver` patch overrides generated names, such as adding a `Mock` suffix so factories do not clash with imported types. Members you leave out keep `resolverFaker`. Next to the shared `name`, `file`, and `imports` members described under [`resolver`](https://kubb.dev/docs/5.x/reference/plugin-options#resolver), `resolverFaker` has these:

::code-collapse{name="ResolverFaker patch members"}

```typescript [Partial override]
type ResolverFakerPatch = {
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
