---
'@kubb/plugin-redoc': minor
---

Map the OpenAPI 3.2 tag fields onto the Redoc extensions Redoc 2 reads: a tag's `summary` becomes its `x-displayName`, and tags that nest through `parent` become `x-tagGroups`, one group per top-level tag.
