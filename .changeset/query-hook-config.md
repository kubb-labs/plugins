---
'@kubb/plugin-react-query': minor
'@kubb/plugin-vue-query': minor
'@kubb/plugin-swr': minor
---

Type the hooks' `client` config from the operation, `Omit<Options<AddPetOptions>, ...>`, and call the client without casts.

- The config leaves out the request groups and `throwOnError`, which the hook sets. Remove a `throwOnError` you pass there; the hook always sets `true`.
- For a mutation with several request media types, pick the media types on the mutation variables, such as `{ body, contentType: { request: 'application/xml', response: 'application/json' } }`, not on `client`.
- vue-query infinite queries send the page param with the resolved `query`, not with the fields of a ref.
