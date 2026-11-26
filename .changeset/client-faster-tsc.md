---
'@kubb/plugin-client': patch
---

Generated clients type-check faster. An operation's per-status response headers map is now declared once in its file, such as `type AddPetResponseHeaders = { '201': AddPetStatus201Headers }`, and `withUnwrap` gets its result type as a type argument. On the DigitalOcean spec with `pluginFetch()`, this cuts TypeScript instantiations from 450,746 to 195,122 and check time by about a third. The generated types are unchanged.
