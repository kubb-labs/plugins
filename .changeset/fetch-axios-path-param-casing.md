---
"@kubb/plugin-fetch": patch
"@kubb/plugin-axios": patch
---

Fix path parameter interpolation when the OpenAPI placeholder uses a different casing than the generated `path` option. The generated `url` literal now camelCases its `{placeholder}` names (`/projects/{project_id}` becomes `/projects/{projectId}`) so they line up with the camelCase keys on the grouped `path` request option. The runtime client looks each placeholder up by key, so a snake_case path param such as `project_id` is no longer dropped and the request reaches the right URL.
