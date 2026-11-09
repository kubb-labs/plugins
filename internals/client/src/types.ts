/**
 * Shape of the value a generated operation function resolves to.
 * - `'full'`: the complete `{ status, data, error, contentType, request, response }` result.
 * - `'data'`: the bare success body when `throwOnError` is true, or the full result when it is false
 *   so callers can inspect `error`.
 * - `'plain'`: the client's own promise typed as `RequestResult`, with no `withUnwrap` / `unwrapResult`
 *   helper. Backs `@kubb/plugin-client`.
 */
export type ReturnTypeOption = 'full' | 'data' | 'plain'
