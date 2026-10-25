---
"@kubb/plugin-ts": minor
"@kubb/plugin-client": minor
"@kubb/plugin-fetch": minor
"@kubb/plugin-axios": minor
"@kubb/plugin-react-query": minor
"@kubb/plugin-swr": minor
"@kubb/plugin-vue-query": minor
"@kubb/plugin-mcp": patch
---

Tie a request body's media type to its body variant. When a request body offers several media types, `<Name>Options` becomes a union that pairs each body variant with its `contentType.request`: the first media type stays the default and `contentType` is optional for it, while any other variant now requires `contentType: { request: '…' }`. Passing the JSON body of a multipart-first operation without it is a type error instead of being sent as multipart. Mutation hooks forward the chosen `contentType` to the client call.
