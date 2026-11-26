---
'@kubb/plugin-ts': patch
---

A generated type no longer carries the `@example` of its whole schema or response body, which printed a full payload on one line. Property examples such as `@example 5000` stay. On the DigitalOcean spec this removes 0.3 MB of output.
