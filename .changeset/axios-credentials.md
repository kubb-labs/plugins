---
'@kubb/plugin-axios': patch
---

Honor `credentials` in the axios transport. Before, axios ignored the option. `include` now sets `withCredentials: true`, so cross-origin calls send cookies, and `omit` sets `withCredentials: false`. `same-origin` keeps the adapter's default. The browser XHR adapter cannot omit same-origin cookies, so there `omit` behaves like `same-origin`. The fetch adapter honors all three values.
