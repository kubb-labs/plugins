---
"@kubb/plugin-zod": minor
"@kubb/plugin-faker": minor
---

Emit generated string literals with single quotes and tighten client function spacing so output reads cleanly without a formatter. The shared `stringify` helper now produces single-quoted literals, so zod enums, `.describe(...)`, defaults, and faker values use single quotes. The client component drops the redundant `<br/>` breaks: the config destructure is followed by one blank line (not two), and `requestData`/`formData` are grouped with no blank between them. HTTP method, content type, and response type are emitted single-quoted via `stringify`.
