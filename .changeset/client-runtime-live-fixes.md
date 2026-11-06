---
'@kubb/plugin-client': patch
'@kubb/plugin-fetch': patch
'@kubb/plugin-axios': patch
---

Fix three cases found by calling real servers.

- The fetch transport returns a body labeled `application/json` that is not JSON as text, instead of throwing a `SyntaxError`.
- The axios transport returns `undefined` for a 204, 205, or 304, as the fetch transport does. It returned `''`.
- A stream call stops at its `signal` before the next event, so `lastEventId` stays at the last event you saw.
