---
"@kubb/plugin-cypress": major
"@kubb/plugin-faker": major
"@kubb/plugin-fetch": major
"@kubb/plugin-mcp": major
"@kubb/plugin-msw": major
"@kubb/plugin-react-query": major
"@kubb/plugin-swr": major
"@kubb/plugin-ts": major
"@kubb/plugin-vue-query": major
"@kubb/plugin-zod": major
---

**Breaking:** Remove the `generators` plugin option.

Plugins no longer accept a `generators` array of custom `Generator` objects. To add or replace generated output, build your own plugin instead. See [Creating plugins](https://kubb.dev/docs/5.x/guides/creating-plugins) for the full walkthrough.
