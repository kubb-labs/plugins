---
'@kubb/plugin-ts': patch
---

Split enum keys at a digit followed by an uppercase letter when `enum.keyCasing` is `snakeCase` or `screamingSnakeCase`. `sensor2Reading` now becomes `sensor2_reading` with `snakeCase` and `SENSOR2_READING` with `screamingSnakeCase`. The enum values stay the same.
