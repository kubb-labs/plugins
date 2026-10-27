---
'@kubb/plugin-ts': patch
---

With `enum.keyCasing: 'snakeCase'` or `'screamingSnakeCase'`, an enum key that is already in that casing now stays unchanged, and acronyms, slashes, and colons now split words.

| Key                | Before              | After              |
| ------------------ | ------------------- | ------------------ |
| `COOL_2D_DRAWING`  | `COOL_2_D_DRAWING`  | `COOL_2D_DRAWING`  |
| `RANKED_3RD_PLACE` | `RANKED_3_RD_PLACE` | `RANKED_3RD_PLACE` |
| `HTTPResponse`     | `HTTPRESPONSE`      | `HTTP_RESPONSE`    |
| `pets/{id}:list`   | `PETSIDLIST`        | `PETS_ID_LIST`     |

The enum values stay the same.
