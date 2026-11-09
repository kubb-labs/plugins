---
'@kubb/plugin-react-query': patch
'@kubb/plugin-vue-query': patch
'@kubb/plugin-swr': patch
---

Stop importing `@kubb/plugin-zod` at runtime. The built plugins imported it without declaring it as a dependency, which broke strict installs such as Yarn Plug'n'Play.
