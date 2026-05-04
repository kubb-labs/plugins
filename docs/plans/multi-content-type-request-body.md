# Plan: Support Multiple Content Types in requestBody

## Problem

OpenAPI operations can declare multiple `requestBody.content` entries for the same operation. A common example is an upload endpoint that accepts both `application/json` metadata and `multipart/form-data` file uploads.

The AST already exposes `requestBody.content` as an array. The plugin layer must preserve every entry instead of reading only `content[0]`.

## Research conclusion

The current direction makes sense: generate one operation-level API and select the request content type at call time. This keeps Kubb output aligned with OpenAPI, where one operation can accept multiple media types for the same request body.

Keeping `contentType` on `RequestConfig` also makes sense because the selected media type is transport metadata. The generated operation should still derive a typed literal union from the OpenAPI content entries, use the first declared media type as the default, and pass the selected value into the client config so fetch and axios can set the matching request header.

The approach is incomplete when `contentType` is destructured out of config and not forwarded to the underlying client. TanStack wrappers also need a clear way to choose the content type for each mutation call or, if the choice stays hook-level only, the generated documentation and types must make that limitation explicit.

## Current state

| Area | Status | Notes |
|---|---:|---|
| AST input | Done | `requestBody.content` already contains all media types when adapter-oas does not receive a global content type override. |
| `plugin-ts` | Done | Multi-content request bodies emit individual data types plus a union alias such as `UploadFileData = UploadFileJsonData \| UploadFileFormData`. |
| `plugin-client` function client | Partial | Generated clients compute a default `contentType` and switch between `requestData` and `FormData` when multipart is present. |
| `plugin-client` form-data detection | Done | Imports now check all content entries with `.some()` instead of only `content[0]`. |
| Fetch client | Partial | `RequestConfig` includes `contentType?: string`, and fetch sets `Content-Type` when the value is not `multipart/form-data`. |
| Axios client | Partial | `RequestConfig` includes `contentType?: string`, but axios does not yet translate it into request headers. |
| React Query | Partial | The standalone `contentType` mutation variable was removed, and `buildFormData` import is conditional. Per-mutation content type selection still needs a final design. |
| Vue Query | Partial | Vue Query needs parity with React Query for conditional imports and content type selection. |
| Examples | Done | Examples regenerate and typecheck after adding `contentType` to the published fetch and axios client files. |
| Copilot setup | Done | The setup workflow installs RTK from `rtk-ai/rtk` so future agent sessions can use the `rtk` CLI. |

## What still needs work

### 1. Forward `contentType` to the transport client

Generated clients currently destructure `contentType` from `config` before building the request. The selected value should still reach the transport client.

```ts [generated-client.ts]
const { client: request = fetch, contentType = 'application/json', ...requestConfig } = config

await request({
  data: contentType === 'multipart/form-data' ? (formData as FormData) : requestData,
  contentType,
  ...requestConfig,
})
```

The generated request config type should narrow `contentType` to the OpenAPI literal union for that operation, for example:

```ts [generated-client.ts]
config: Partial<RequestConfig<UploadFileData>> & {
  client?: Client
  contentType?: 'application/json' | 'multipart/form-data'
} = {}
```

### 2. Update axios to honor `config.contentType`

The axios client should set `Content-Type` from `config.contentType` in the same way the fetch client does. It should skip an explicit header for `multipart/form-data` when the body is `FormData`, so axios or the browser can attach the boundary.

### 3. Finish TanStack Query behavior

React Query and Vue Query should share the same policy through `internals/tanstack-query`.

Recommended direction:

1. Keep `contentType` as `RequestConfig` metadata, not as a separate top-level generated function argument.
2. Allow hook-level configuration through the existing `client` option.
3. Decide whether mutation-call-level overrides are required. If they are required, add a typed `client` or `config` value to mutation variables and forward it into the generated client call.
4. Keep React Query and Vue Query snapshots aligned.

### 4. Update class and static clients

Class-based clients should use the same multi-content logic as function clients:

- Detect multipart content with `.some()` across every content entry.
- Use the runtime `contentType` selector when both JSON and multipart bodies exist.
- Pass the selected `contentType` into the request config.

### 5. Add coverage for edge cases

Add or update snapshots and unit tests for these cases:

- A single content type remains byte-for-byte compatible.
- `application/json` + `multipart/form-data` switches payloads correctly.
- Non-form multi-content operations still expose the typed literal `contentType` union.
- Fetch sets `Content-Type` for JSON and other non-multipart content types.
- Axios sets `Content-Type` for JSON and other non-multipart content types.
- React Query and Vue Query expose the same content type override behavior.
- Class and static clients match the function client behavior.

## Validation checklist

- [x] Merge `main` into the branch.
- [x] Regenerate examples.
- [x] Typecheck examples.
- [x] Run the existing test suite.
- [ ] Forward `contentType` to fetch and axios at runtime.
- [ ] Add literal union typing to generated request config.
- [ ] Finish React Query and Vue Query parity.
- [ ] Update class and static client generation.
- [ ] Add snapshots for the remaining edge cases.
