---
'@kubb/plugin-client': patch
'@kubb/plugin-fetch': patch
'@kubb/plugin-axios': patch
---

Make the fetch and axios clients handle headers, bodies, errors, streams and aborts the same way, and type-check the runtime under strict settings.

- Headers: send `Content-Type` and `Cookie` once in any letter case, and skip `Content-Type` without a body. An array or object header without a `style` goes out as `simple` (`X-Ids: 3,4`) instead of JSON.
- Query: an object parameter without a `style` goes out as `form` with explode (`name=odie&age=3`) instead of `deepObject`. Set `style: deepObject` on the parameter to keep brackets.
- Bodies: return text for a non-JSON body labeled JSON and `undefined` for an empty body. `body: null` sends the JSON document `null`. An object sent as XML, YAML, or CSV without a codec throws a `TypeError`.
- Errors: report `{ status, statusText }` as `error` for a failed call without a body, return the parsed error body on a failed `blob` or `arraybuffer` call, and throw what an error interceptor returns.
- Validation: `validator.error` is a map by status, such as `{ 404: getPetStatus404Schema, '5xx': getPetStatus5xxSchema }`, matched by status, then range, then `default`. With `throwOnError: false`, a status the document leaves out resolves with its body as `error`. A per-call `validator` or `styles` entry merges with the generated one.
- Streams: `client.stream` sends `Accept: text/event-stream`, also for a response that offers `application/json` or `text/event-stream`, and Kubb writes `.kubb/sse.ts` for it. A stream call that cannot read its body cancels it before it throws. An aborted call or stream rejects with the signal's reason.
- Security: each call's `security` comes from the adapter's AST, so an OpenAPI 3.2 requirement that names a scheme by URI resolves, and a `mutualTLS` scheme stays out. A `'` in an API key name, scope or OAuth flow name no longer breaks the generated code.
- `HttpMethod` includes `TRACE`. `fetch` and ky still reject it, so use `@kubb/plugin-axios` or a custom transport.
- On fetch, pass Next.js's `next` option. On axios, honor `credentials`, return a `Blob` on Node, send typed arrays and web `ReadableStream` bodies, decode a body by its `Content-Type`, and stop labeling a string body `application/x-www-form-urlencoded`.
- Types: the `.kubb/` runtime type-checks with `exactOptionalPropertyTypes`, `noPropertyAccessFromIndexSignature`, `isolatedDeclarations` and `@total-typescript/ts-reset`. `ResponseErrorOf`, `StreamResult` and `isResponseError` from `templates/client.ts` default to the client's native request and response instead of `unknown`.
