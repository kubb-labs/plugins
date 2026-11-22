---
'@kubb/plugin-react-query': minor
'@kubb/plugin-vue-query': minor
---

Allow custom `queryKey` transformers to include header parameters in generated cache keys.

Generated key helpers accept optional `headers`, even when the request requires them. Default keys still exclude headers.

```typescript
queryKey: (props) => [
  ...queryKeyTransformer(props),
  ...(props.node.parameters?.some((param) => param.in === 'header') ? ['...(headers ? [headers] : [])'] : []),
]
```
