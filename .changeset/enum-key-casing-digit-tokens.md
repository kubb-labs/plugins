---
'@kubb/plugin-ts': patch
---

Keep digit-letter tokens such as `2D` and `3RD` together when `enum.keyCasing` is `snakeCase` or `screamingSnakeCase`. `COOL_2D_DRAWING` now stays `COOL_2D_DRAWING` instead of becoming `COOL_2_D_DRAWING`, and `sensor2Reading` still becomes `SENSOR2_READING`.
