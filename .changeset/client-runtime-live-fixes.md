---
'@kubb/plugin-client': patch
'@kubb/plugin-fetch': patch
'@kubb/plugin-axios': patch
---

Three fixes found by running the generated fetch and axios clients against live APIs:

- The fetch transport keeps a body labeled `application/json` that is not JSON as text, instead of throwing a `SyntaxError`. Petstore answers `DELETE /pet/{petId}` with `Pet deleted` under a JSON content type, and the axios transport already returned the text.
- The axios transport reads a bodiless status, 204, 205, or 304, as no data, so `data` is `undefined` on both transports instead of `''` on axios.
- A stream call stops at its `signal`: once the consumer aborts, the loop ends with the abort reason before the next event of the same chunk, and `lastEventId` stays at the last event the consumer saw.
