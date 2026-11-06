---
'@kubb/plugin-axios': patch
---

Honor `credentials` in the axios transport. axios ignored it before.

- `include` sends cookies cross-origin, `same-origin` keeps them same-origin, and `omit` sends none.
- The value wins over `withCredentials` set in `options` or on the axios instance.
- In the browser, `omit` sends through the fetch adapter, because the XHR adapter cannot omit same-origin cookies.
