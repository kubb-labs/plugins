# @kubb/plugin-ky

## 0.1.0

### Minor Changes

- [#1491](https://github.com/kubb-labs/plugins/pull/1491) [`a1b4efe`](https://github.com/kubb-labs/plugins/commit/a1b4efe774ac02112c77bb1b84195c5f923b8f5b) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Add `@kubb/plugin-ky`, which generates a type-safe HTTP client that sends with [Ky](https://github.com/sindresorhus/ky). Pass Ky options such as `retry`, `timeout`, and `hooks` in `options`, on a call or with `client.setConfig`. A call is sent once unless you set `retry`, as with the fetch and axios clients. The query and MCP plugins accept `client: 'ky'`.
  
  ```ts
  import { pluginKy } from '@kubb/plugin-ky'
  
  export default defineConfig({
    plugins: [pluginTs(), pluginKy({ baseURL: 'https://petstore.swagger.io/v2' })],
  })
  ```
  
  The `@kubb/plugin-fetch` and `@kubb/plugin-client` docs now point to `@kubb/plugin-ky`.

### Patch Changes

- [#1506](https://github.com/kubb-labs/plugins/pull/1506) [`38204b3`](https://github.com/kubb-labs/plugins/commit/38204b3a786cc285b73fc09007794836f0cfcf04) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Use Kubb 5.21.2.

- [#1505](https://github.com/kubb-labs/plugins/pull/1505) [`e47b1e9`](https://github.com/kubb-labs/plugins/commit/e47b1e9fbd0de17b9146afbc30775e2ab4dbd2ca) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Mark `@kubb/plugin-ky` and `@kubb/plugin-valibot` as beta in `kubb-extension.json`. kubb.dev and Kubb Studio show a Beta badge for them. Their options and output can still change in a minor release.
- Updated dependencies [[`a1b4efe`](https://github.com/kubb-labs/plugins/commit/a1b4efe774ac02112c77bb1b84195c5f923b8f5b), [`4dea353`](https://github.com/kubb-labs/plugins/commit/4dea353d0898f9fcf640199d467a004653cf86c0), [`38204b3`](https://github.com/kubb-labs/plugins/commit/38204b3a786cc285b73fc09007794836f0cfcf04)]:
  - @kubb/plugin-client@6.2.0
