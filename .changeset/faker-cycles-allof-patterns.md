---
'@kubb/plugin-faker': patch
---

Generate mocks that pass the Zod schema of the same value for recursive filters, extended schemas and regex patterns.

- Pick a variant outside the cycle in a discriminated `oneOf` whose schemas reference each other, such as `And`, `Or` and `Not` filters that list one another. Such a mock overflowed the stack.
- Keep the literal an `allOf` member sets over the plain string of the base it references. A base listed after the member used to overwrite it.
- Turn `\d`, `\w`, escaped characters such as `\+`, and open-ended counts such as `{1,}` into a form `faker.helpers.fromRegExp` reads. `^\+[1-9]\d{1,14}$` used to give `\+7\ddd`.
