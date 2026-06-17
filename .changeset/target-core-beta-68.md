---
"@kubb/plugin-react-query": patch
---

Target `@kubb/core` `5.0.0-beta.68`. Drop the removed `output.override` handling in the custom hook options file generator, which now writes the file only when it does not already exist.
