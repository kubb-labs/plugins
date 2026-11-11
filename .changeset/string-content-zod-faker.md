---
'@kubb/plugin-zod': minor
'@kubb/plugin-faker': minor
---

Check and mock the document a string holds, from `contentMediaType`, `contentSchema` and `contentEncoding`.

- Zod checks a string with a JSON `contentMediaType` and a `contentSchema`: it must parse as JSON that passes the schema. The value stays a string.
- Zod prints `contentEncoding: base64` as `z.base64()` and `base64url` as `z.base64url()`.
- Faker mocks such a string as `JSON.stringify(...)` of a mock of the `contentSchema`, and an encoded string as valid base64 or base64url.
- A string with both an encoding and a `contentSchema` is checked and mocked for its encoding only.
