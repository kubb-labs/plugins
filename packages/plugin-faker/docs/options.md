# Options

Pass these options to `pluginFaker()`. Shared options link to [Shared plugin options](https://kubb.dev/docs/5.x/reference/plugin-options), and this page gives only their default here.

## Options overview

| Option                                                                    | Purpose                                                                              | Default                                        |
| ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------- |
| [`output`](https://kubb.dev/docs/5.x/reference/plugin-options#output)     | Where files are written.                                                             | `{ path: 'mocks', barrel: { type: 'named' } }` |
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

Sets the input and return types of object and intersection factories. Both modes generate the same values and shallow-merge the overrides.

|          |                          |
| -------- | ------------------------ |
| Type     | `'inferred' \| 'schema'` |
| Required | `false`                  |
| Default  | `'inferred'`             |

::field-group

:::field{name="'inferred'"}
Takes any `Partial<Model>` and keeps its literal types. Returns the generated value types merged with the override types, so optional and nullable fields keep their concrete value types.
:::

:::field{name="'schema'"}
Takes a `Partial<Model>` and returns the declared model type, with its optional and nullable fields. Use it for fixtures you change after creation.
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

To pick a mode for some schemas only, use [`override`](https://kubb.dev/docs/5.x/reference/plugin-options#override). A string `pattern` is a regular expression, so `'Order'` also matches `OrderItem`. This sets `typeMode` for `Order` alone:

```typescript [kubb.config.ts]
import { defineConfig } from 'kubb/config'
import { pluginFaker } from '@kubb/plugin-faker'
import { pluginTs } from '@kubb/plugin-ts'

export default defineConfig({
  input: './petStore.yaml',
  output: { path: './src/gen' },
  plugins: [
    pluginTs(),
    pluginFaker({
      override: [{ type: 'schemaName', pattern: '^Order$', options: { typeMode: 'schema' } }],
    }),
  ],
})
```

### dateParser

Library that formats `date`, `time`, and `date-time` fields typed as strings. Install the library you pick in the app.

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

Any other module name works when its default export has the dayjs API. Kubb imports it under its camelCased name, so `'my-date-lib'` becomes `myDateLib`.

> [!WARNING]
> A value other than `'faker'` fails generation when the adapter types dates as `Date`, such as with `dateType: 'date'`.

### regexGenerator

Library that generates strings matching a regex `pattern` in the spec.

|          |                        |
| -------- | ---------------------- |
| Type     | `'faker' \| 'randexp'` |
| Required | `false`                |
| Default  | `'faker'`              |

::field-group

:::field{name="'faker'"}
Writes `faker.helpers.fromRegExp(/pattern/)` and needs no extra dependency. Faker does not support groups, alternation (`a|b`), or `\s`.
:::

:::field{name="'randexp'"}
Writes `new RandExp(pattern).gen()`, which supports a wider regex grammar. Install `randexp` in the app.
:::

::

### locale

[Faker locale code](https://fakerjs.dev/api/localization.html). Kubb imports the matching `fakerXX` export from `@faker-js/faker` as `faker`, so generated values fit the target region.

|          |          |
| -------- | -------- |
| Type     | `string` |
| Required | `false`  |
| Default  | `'en'`   |

```typescript [locale: 'de_AT']
import { fakerDE_AT as faker } from '@faker-js/faker'
```

### seed

Kubb calls `faker.seed(...)` with this value at the top of each generated file, so every run returns the same data. Use it for snapshot tests. A second call to the same factory returns the next values in the sequence.

|          |                      |
| -------- | -------------------- |
| Type     | `number \| number[]` |
| Required | `false`              |

### printer

Replaces the Faker handler for a schema type, such as `'integer'` or `'date'`. Each handler returns the Faker expression as a string. Inside a handler, `this.transform` recurses into nested nodes and `this.options` holds the printer options. See the [printer guide](https://kubb.dev/docs/5.x/how-to/customize#printers).

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

A `resolver` patch can add a `Mock` suffix so factories do not clash with imported types. Members you leave out of the patch keep `resolverFaker`. Besides the shared `name`, `file`, and `imports` members of [`resolver`](https://kubb.dev/docs/5.x/reference/plugin-options#resolver), `resolverFaker` has these:

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
