---
"@kubb/plugin-ts": minor
"@kubb/plugin-fetch": minor
---

Use the generated `<Operation>RequestConfig` type directly as the slim-client function input.

`@kubb/plugin-ts` now emits the request-config type with the same field names the runtime client uses — `body`, `path`, `query`, `headers`, `url` — instead of `data`, `pathParams`, `queryParams`, `headerParams`, `url`. `body` is required when the operation has a request body.

```ts
// Before
export type AddPetRequestConfig = {
  data?: AddPetData
  pathParams?: never
  queryParams?: never
  headerParams?: never
  url: '/pet'
}

// After
export type AddPetRequestConfig = {
  body: AddPetData
  path?: never
  query?: never
  headers?: never
  url: '/pet'
}
```

`@kubb/plugin-fetch` consumes that type as-is, so each operation no longer emits a separate file-local `<Operation>Request` type to rename the fields:

```ts
// Before
type AddPetRequest = {
  body: AddPetRequestConfig['data']
  path?: AddPetRequestConfig['pathParams']
  query?: AddPetRequestConfig['queryParams']
  headers?: AddPetRequestConfig['headerParams']
  url: AddPetRequestConfig['url']
}
export function addPet<ThrowOnError extends boolean = true>(options: Options<AddPetRequest, ThrowOnError>): ...

// After
export function addPet<ThrowOnError extends boolean = true>(options: Options<AddPetRequestConfig, ThrowOnError>): ...
```
