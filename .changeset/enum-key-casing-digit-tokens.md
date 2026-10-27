---
'@kubb/plugin-ts': patch
---

`enum.keyCasing: 'snakeCase'` and `'screamingSnakeCase'` now split enum keys into words the same way `camelCase` and `pascalCase` do. Keys that are already in the target casing stay unchanged.

| Key                | Before              | After              |
| ------------------ | ------------------- | ------------------ |
| `COOL_2D_DRAWING`  | `COOL_2_D_DRAWING`  | `COOL_2D_DRAWING`  |
| `RANKED_3RD_PLACE` | `RANKED_3_RD_PLACE` | `RANKED_3RD_PLACE` |
| `HTTPResponse`     | `HTTPRESPONSE`      | `HTTP_RESPONSE`    |
| `pets/{id}:list`   | `PETSIDLIST`        | `PETS_ID_LIST`     |

The enum values stay the same.
