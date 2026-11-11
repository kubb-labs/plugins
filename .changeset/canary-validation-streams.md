---
'@kubb/plugin-client': patch
'@kubb/plugin-fetch': patch
'@kubb/plugin-axios': patch
'@kubb/plugin-msw': patch
'@kubb/plugin-mcp': patch
---

Server-Sent Events whose `itemSchema` types `data` as a string for some events only keep that `data` as text for those events, so `data: 123` is no longer parsed to a number. This also works when a discriminator names the events. An MSW mock sends string `data` without JSON quotes. `plugin-mcp` generates no tool for a response that offers a stream media type next to another type, which returned an unread stream.
