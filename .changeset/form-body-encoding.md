---
"@kubb/plugin-client": patch
---

Generated clients now pass the `encoding` of a form or multipart request body as `styles.body`, so `application/x-www-form-urlencoded` and `multipart/form-data` properties are serialized with the `style`, `explode`, `allowReserved` and `contentType` the spec declares.
