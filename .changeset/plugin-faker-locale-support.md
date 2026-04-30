---
"@kubb/plugin-faker": minor
---

Add `locale` option to generate mock data in a specific language.

Set `locale` to any [Faker.js locale code](https://fakerjs.dev/api/localization.html) (e.g. `'de'`, `'fr'`, `'de_AT'`) and the generated file imports the matching localized faker instance instead of the default English one. Names, addresses, phone numbers, and other locale-aware fields then reflect the target region.

```ts
pluginFaker({
  output: { path: 'mocks' },
  locale: 'de',
})
```

The generated output uses `import { fakerDE as faker } from '@faker-js/faker'` so all existing call sites remain unchanged.
