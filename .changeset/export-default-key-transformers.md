---
'@kubb/plugin-vue-query': patch
'@kubb/plugin-react-query': patch
'@kubb/plugin-swr': patch
---

Export the default `queryKeyTransformer` and `mutationKeyTransformer` so a custom `queryKey` or `mutationKey` builder can extend the default key instead of copying it. `@kubb/plugin-vue-query` and `@kubb/plugin-react-query` also export the `Transformer` type now. Generated output is unchanged.

```ts
import { queryKeyTransformer } from '@kubb/plugin-vue-query'

pluginVueQuery({
  queryKey: (props) => [JSON.stringify(props.node.operationId), ...queryKeyTransformer(props)],
})
```
