---
'@kubb/plugin-axios': patch
---

Honor `credentials` in the axios transport. `credentials: 'include'` now sets `withCredentials: true`, so cross-origin calls send cookies. Before, axios ignored the option.
