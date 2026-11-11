---
'@kubb/plugin-react-query': patch
'@kubb/plugin-vue-query': patch
'@kubb/plugin-swr': patch
---

Fix the hooks' runtime import and result types.

- Stop importing `@kubb/plugin-zod` at runtime. The built plugins imported it without declaring it as a dependency, which broke strict installs such as Yarn Plug'n'Play.
- Type the declared response headers on a hook's `returnType: 'full'` result, so `data.headers.get` suggests their names. A custom client module keeps untyped headers.
- Type a hook's data for a response with a stream variant as the body or the stream, as the client does.
