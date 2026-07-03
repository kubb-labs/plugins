---
'@kubb/plugin-react-query': patch
'@kubb/plugin-vue-query': patch
'@kubb/plugin-swr': patch
---

Change the default `query.methods`/`mutation.methods` values from lowercase (`['get']`, `['post', 'put', 'patch', 'delete']`) to uppercase (`['GET']`, `['POST', 'PUT', 'PATCH', 'DELETE']`), matching the HTTP method token casing defined in RFC 7231 (and RFC 2616 before it). Matching against the operation's method was already case-insensitive, so this doesn't change generated output, only the documented and default casing.
