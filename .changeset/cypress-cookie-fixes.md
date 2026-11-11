---
'@kubb/plugin-cypress': patch
---

Fix requests with cookie parameters or a scalar body.

- Send a `style: cookie` parameter without percent-encoding and exploded by default, like the generated clients: an array sends `ids=x; ids=y` and an object `id=abc; lang=en`. An array or object no longer throws.
- Fix the type error on `value instanceof Date` in a request whose cookies are all strings.
- Compile a request body that is one number or has no schema type, and send an `int64` body as a number.
- Throw a `TypeError` for an `int64` body past the safe-integer range, where it lost precision.
- Explode a `form` cookie array or object that sets `explode: true`, so `ids: [1, 2]` sends `ids=1; ids=2`.
