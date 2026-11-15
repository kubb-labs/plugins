# Faker

The Faker plugin generates one factory function per schema. Each factory returns mock data from Faker.js and takes partial data that overrides the generated values. Use the factories in tests, Storybook, and local development without a running backend. `@kubb/plugin-msw` can use them to fill mock responses.

## Setup

- Add `@kubb/plugin-ts` for the factory types. Generation fails without it.
- Install `@faker-js/faker` v10 in the app that uses the generated code.
- Install `dayjs`, `moment`, or `randexp` when you pick it in `dateParser` or `regexGenerator`.

## Options worth knowing

| Option                                                                                        | Default      | What it does                                                                                               |
| --------------------------------------------------------------------------------------------- | ------------ | ---------------------------------------------------------------------------------------------------------- |
| [`seed`](https://kubb.dev/extensions/kubb-labs/plugin-faker/options#seed)                     | None         | Calls `faker.seed(...)` with a fixed value, so every run returns the same data.                            |
| [`locale`](https://kubb.dev/extensions/kubb-labs/plugin-faker/options#locale)                 | `'en'`       | Sets the Faker locale, such as `'de'`.                                                                     |
| [`typeMode`](https://kubb.dev/extensions/kubb-labs/plugin-faker/options#typemode)             | `'inferred'` | `'inferred'` derives the factory types from the generated values. `'schema'` uses the declared model type. |
| [`dateParser`](https://kubb.dev/extensions/kubb-labs/plugin-faker/options#dateparser)         | `'faker'`    | Formats `date`, `time`, and `date-time` strings with `faker`, `dayjs`, or `moment`.                        |
| [`regexGenerator`](https://kubb.dev/extensions/kubb-labs/plugin-faker/options#regexgenerator) | `'faker'`    | Turns a `pattern` into a string with `faker` or `randexp`.                                                 |

> [!WARNING]
> A `dateParser` other than `'faker'` fails generation when the adapter types a date or time as `Date`, for example with `dateType: 'date'`.

## Example

The config below generates the factories with a fixed seed. For a `Pet` schema, the plugin writes `createPet.ts`:

::code-group

```typescript [kubb.config.ts]
import { defineConfig } from 'kubb/config'
import { pluginTs } from '@kubb/plugin-ts'
import { pluginFaker } from '@kubb/plugin-faker'

export default defineConfig({
  input: './petStore.yaml',
  output: { path: './src/gen' },
  plugins: [
    pluginTs(),
    pluginFaker({ seed: [100] }),
  ],
})
```

```typescript [src/gen/mocks/createPet.ts]
import type { Pet } from '../types/Pet'
import { fakerEN as faker } from '@faker-js/faker'

faker.seed([100])

export function createPet<TData extends Partial<Pet> = object>(data?: TData) {
  const defaultFakeData = {
    id: faker.number.bigInt(),
    name: faker.string.alpha(),
    status: faker.helpers.arrayElement(['available', 'pending', 'sold'] as Array<NonNullable<Pet>['status']>),
  }
  return {
    ...defaultFakeData,
    ...(data || {}),
  } as unknown as Omit<typeof defaultFakeData, keyof NoInfer<TData>> & NoInfer<TData>
}
```

::

Call `createPet({ name: 'Rex' })` to override one field and keep the generated rest.
