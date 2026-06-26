---
"@kubb/plugin-fetch": minor
"@kubb/plugin-axios": minor
---

`querySerializer` now accepts declarative options as well as a function. Pass a `QuerySerializerOptions` object to pick an array or object style with `explode`, or keep reserved characters with `allowReserved`, and the runtime builds the serializer for you:

```ts
client.setConfig({
  querySerializer: {
    array: { style: 'pipeDelimited', explode: false },
    object: { style: 'deepObject', explode: true },
  },
})
```

A new `createQuerySerializer(options)` export builds the same function directly, and the exported `QuerySerializerOptions` type covers the `form`/`spaceDelimited`/`pipeDelimited` array styles, the `form`/`deepObject` object styles, and `allowReserved`. The default stays the same: arrays explode into repeated keys and nested objects use the `deepObject` style. A function still works for full control.
</content>
