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

A request body offered in several media types now pairs each body variant with its `contentType.request`. The first media type stays the default; any other variant must pass `contentType`, so sending the JSON body of a multipart-first operation as multipart is a type error.
