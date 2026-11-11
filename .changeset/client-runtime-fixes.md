---
'@kubb/plugin-client': patch
'@kubb/plugin-fetch': patch
'@kubb/plugin-axios': patch
---

Make the fetch and axios clients handle headers, bodies, errors and streams the same way.

- Send an object query parameter without a `style` as `name=odie&age=3` and an array header as `X-Ids: 3,4`, the OpenAPI defaults. Set `style: deepObject` to keep `filter[name]=odie`.
- Send `body: null` as the JSON document `null`, return `undefined` for an empty body, and report `{ status, statusText }` as `error` for a failed call without a body.
- Check an error body against the schema of its own status with a `validator.error` map, such as `{ 404: getPetStatus404Schema, '5xx': getPetStatus5xxSchema }`. A status the document leaves out resolves with its body as `error`.
- Send `Accept: text/event-stream` on a stream call, and reject an aborted call or stream with the signal's reason.
- Type-check the `.kubb/` runtime with `exactOptionalPropertyTypes`, `noPropertyAccessFromIndexSignature`, `isolatedDeclarations` and `@total-typescript/ts-reset`.
