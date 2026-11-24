---
'@kubb/plugin-client': minor
'@kubb/plugin-fetch': minor
'@kubb/plugin-axios': minor
'@kubb/plugin-ky': minor
---

The generated client throws a `TypeError` for a path parameter it cannot send safely. Regenerate to get the new `.kubb/core.ts`.

- A missing path parameter throws `Missing path parameter petId.` Before, `/pets/{petId}` was sent as `/pets/`, which is another endpoint.
- A path parameter of `.` or `..` throws, because a URL parser resolves it against the path.
- An API key sent as a cookie throws when it holds a character a cookie cannot carry, such as `;`, which would start another cookie.
- A JSON Lines record that is not valid JSON throws a `ValidationError`, like every other JSON body. It was a `SyntaxError`.
- `onValidationError` gets the URL template for a response failure, as it does for a request failure. The resolved URL could carry an API key in its query.
