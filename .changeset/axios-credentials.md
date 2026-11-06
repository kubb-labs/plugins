---
'@kubb/plugin-axios': patch
---

Honor `credentials` in the axios transport. Before, axios ignored the option. `include` now sends cookies cross-origin, `same-origin` keeps them same-origin, and `omit` sends none. The value wins over `withCredentials` set in `options` or on the axios instance. The fetch adapter receives the value as is. In the browser, `omit` sends through the fetch adapter, because the XHR adapter cannot omit same-origin cookies. An adapter set on the call or the instance is kept.
