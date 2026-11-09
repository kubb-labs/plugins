---
'@kubb/plugin-axios': patch
---

Reject with the signal's reason when a call is aborted while axios still reads the body, as the fetch client does. Before, an abort after the headers arrived, such as an `AbortSignal.timeout()` on an operation that can answer with JSON or an event stream, rejected with axios's `CanceledError`.
