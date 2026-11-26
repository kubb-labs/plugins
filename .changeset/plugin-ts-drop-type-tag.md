---
'@kubb/plugin-ts': patch
---

Property comments no longer end with `@type`, such as `@type integer | undefined`. The tag repeated the TypeScript type next to it. On the DigitalOcean spec this removes 0.15 MB of output.
