# Faker

The Faker plugin generates one factory function per schema. Each factory returns mock data from Faker.js and accepts partial data that overrides the generated values.

Use the factories in tests, Storybook, and local development without a running backend. `@kubb/plugin-msw` can use them to fill mock responses.

## Setup

- Add `@kubb/plugin-ts` for the factory return types. Generation fails without it.
- Install `@faker-js/faker` v10 in the app that uses the generated code.
- Install `dayjs`, `moment`, or `randexp` when you pick it in `dateParser` or `regexGenerator`.

## Options worth knowing

- `seed` passes a fixed seed to `faker.seed(...)`, so every run returns the same sequence of data.
- `locale` sets the Faker locale. The default is `en`.
- `dateParser` formats `date`, `time`, and `date-time` strings with `faker` (default), `dayjs`, or `moment`. Generation fails with `dayjs` or `moment` when the adapter types a date or time as `Date`, for example with `dateType: 'date'`.
- `regexGenerator` turns a `pattern` into a string with `faker` (default) or `randexp`.
- `typeMode` sets the factory types: `inferred` (default) derives them from the generated values, and `schema` uses the declared model type.

See [Options](https://kubb.dev/extensions/kubb-labs/plugin-faker/options) for every option and its default.

## Example

The config below generates the factories with a fixed seed.

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
