---
"@kubb/plugin-fetch": minor
"@kubb/plugin-axios": minor
---

Resolve auth from the OpenAPI spec. Each generated call now carries a `security` array of inline auth objects derived from the operation's requirements (falling back to the global `security`) and `components.securitySchemes`:

```ts
return request({
  method: 'POST',
  url: '/pet',
  security: [{ type: 'http', scheme: 'bearer' }],
  ...config,
})
```

The runtime walks `security` in order and resolves each entry through a single `auth` config field, either a static token or a callback that receives the auth object. It places the result as a bearer or basic `Authorization` header, or an apiKey in the header, query, or cookie. `oauth2` and `openIdConnect` resolve as bearer. With `auth` unset the metadata is ignored, so there is no change for specs that configure nothing.
