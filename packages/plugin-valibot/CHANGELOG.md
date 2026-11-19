# @kubb/plugin-valibot

## 0.1.1

### Patch Changes

- [#1537](https://github.com/kubb-labs/plugins/pull/1537) [`02b78e4`](https://github.com/kubb-labs/plugins/commit/02b78e446dce19df167f582853851cb63f75660b) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Depend on `@kubb/ast` directly, at the same version as `@kubb/kit`. Generated code does not change.

- [#1535](https://github.com/kubb-labs/plugins/pull/1535) [`0441805`](https://github.com/kubb-labs/plugins/commit/0441805441348a5f64cf633cbea38b81072fc0bb) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - `@kubb/plugin-msw` handlers import `MswBody` from a shared `.kubb/mswBody.ts` instead of declaring it in each file.

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
