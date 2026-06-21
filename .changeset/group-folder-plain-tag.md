---
"@kubb/plugin-ts": minor
"@kubb/plugin-zod": minor
"@kubb/plugin-faker": minor
"@kubb/plugin-react-query": minor
"@kubb/plugin-vue-query": minor
"@kubb/plugin-msw": minor
"@kubb/plugin-cypress": minor
"@kubb/plugin-mcp": minor
---

Default tag group folders to the plain camelCased tag.

With `group: { type: 'tag' }`, every plugin now writes to `pet/` instead of `petController/` (and the Cypress and MCP plugins drop the `Requests` suffix too). The suffixes were a leftover convention nothing in the output referenced. To keep the old layout, pass `group: { type: 'tag', name: ({ group }) => \`${group}Controller\` }`.
