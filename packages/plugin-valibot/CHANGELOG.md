# @kubb/plugin-valibot

## 0.1.0

### Minor Changes

- [#1497](https://github.com/kubb-labs/plugins/pull/1497) [`9cc713f`](https://github.com/kubb-labs/plugins/commit/9cc713f66aac9a216570c2e31d6019980f670d93) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Add `@kubb/plugin-valibot`, which generates a [Valibot](https://valibot.dev) schema for every schema in your OpenAPI spec, plus the parameter, request, and response schemas of each operation. Set `inferred: true` to export a type next to each schema, `coercion` to convert input before validation, and `typeGuards` to add `is*` and `assert*` functions. With `dateType: 'date'` on the adapter, response schemas parse a date string into a `Date` and request schemas write it back.
  
  ```ts
  import { pluginValibot } from '@kubb/plugin-valibot'
  
  export default defineConfig({
    plugins: [pluginValibot({ inferred: true })],
  })
  ```

### Patch Changes

- [#1506](https://github.com/kubb-labs/plugins/pull/1506) [`38204b3`](https://github.com/kubb-labs/plugins/commit/38204b3a786cc285b73fc09007794836f0cfcf04) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Use Kubb 5.21.2.

- [#1505](https://github.com/kubb-labs/plugins/pull/1505) [`e47b1e9`](https://github.com/kubb-labs/plugins/commit/e47b1e9fbd0de17b9146afbc30775e2ab4dbd2ca) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Mark `@kubb/plugin-ky` and `@kubb/plugin-valibot` as beta in `kubb-extension.json`. kubb.dev and Kubb Studio show a Beta badge for them. Their options and output can still change in a minor release.
