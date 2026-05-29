---
"@kubb/plugin-faker": patch
---

Default the `locale` option to `'en'`. Generated mock files now import `fakerEN` from `@faker-js/faker` when no locale is set, instead of the base `faker` instance.
