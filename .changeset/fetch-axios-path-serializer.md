---
"@kubb/plugin-fetch": minor
"@kubb/plugin-axios": minor
---

Serialize array and object path parameters instead of emitting `[object Object]`. The runtime client interpolated each `{placeholder}` with `String(value)`, so an array or object path param produced a broken URL (`/pet/[object Object]`).

The generated client now has a `defaultPathSerializer` that follows the OpenAPI `simple` style (`explode: false`): arrays join their URL-encoded members with commas (`/pet/3,4,5`) and objects render as comma-separated `key=value` pairs (`/point/x=1,y=2`); primitives stay URL-encoded as before. It is wired into both the send path and `getUrl`.

A `pathSerializer` option is exposed on `ClientConfig` and `RequestConfig` (mirroring `querySerializer` / `bodySerializer`) so the behavior can be overridden per client or per call.

Full OpenAPI `label` / `matrix` style support needs the per-parameter `style` / `explode` from the spec and will follow as a separate change.
