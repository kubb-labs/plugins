---
"@kubb/plugin-ts": minor
"@kubb/plugin-axios": minor
"@kubb/plugin-fetch": minor
---

Adds a `comments` option that sets how much of each OpenAPI `description` reaches the generated JSDoc. On a large spec descriptions are where the bytes go: they are a third of what Kubb writes, and most of them run several paragraphs repeating what the type signature already says.

The option takes three values:

- `'full'` (default) emits every description in full, so nothing about the current output changes.
- `'brief'` shortens `@description` to its opening sentence. Every other tag is kept, so every type stays documented. Abbreviations like `e.g.` and open brackets do not end a sentence. A description that runs on for 150 characters without one is cut at the last word before 120, never mid-link or mid-word.
- `'none'` emits no JSDoc at all. The generated-by file banner is unaffected.

```ts
pluginTs({ comments: 'brief' })
```

On the OpenAI spec (281 operations) `'brief'` trims 197 KB and `'none'` trims 1.03 MB of a 2.76 MB output.
