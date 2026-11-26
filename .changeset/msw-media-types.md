---
'@kubb/plugin-msw': minor
---

Add a `mediaTypes` option that encodes the mocked response body of a media type with your own function, such as `mediaTypes: { 'application/vnd.acme.stream+json': { name: 'encodeStream', path: '@acme/runtime' } }`. The handler and its response helpers send `encodeStream(data)` for a response with that content type.
