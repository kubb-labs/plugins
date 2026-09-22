---
"@kubb/plugin-vue-query": patch
---

Preserve mutation payload types when resolving request groups with Vue's `toValue`. Bodies with an optional `value` property now compile without being inferred as the property's value type.
