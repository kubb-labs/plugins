---
"@kubb/plugin-ts": minor
---

Improve discriminator handling and string-based type support:

- Named and inline enum variants are now generated correctly for discriminator properties
- String-based types (`uuid`, `email`, `url`, `datetime`, `date`, `time`) are consistently emitted as plain strings
- Operation paths are available in Express-style format (e.g. `/pets/:petId`)
