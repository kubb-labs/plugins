---
'@kubb/plugin-ts': patch
---

Split enum keys at a digit followed by an uppercase letter when `enum.keyCasing` is `snakeCase` or `screamingSnakeCase`, so `sensor2Reading` becomes `SENSOR2_READING` instead of `SENSOR2READING`. The enum values stay the same.
