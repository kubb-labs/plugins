---
'@kubb/plugin-ts': patch
---

The `operations` option in `kubb-extension.json` now has its `path`. Without it, the Kubb registry rejected the manifest and left `@kubb/plugin-ts` out of the extension catalog on kubb.dev.
