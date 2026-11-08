---
'@kubb/plugin-axios': patch
---

Honor `credentials` in the axios transport, which ignored it before.

- `include` sends cookies cross-origin, `same-origin` sends them to the same origin only, and `omit` sends none.
- The value wins over `withCredentials` in `options` or on the axios instance.
- In the browser, `omit` switches to the fetch adapter, because the XHR adapter cannot leave out same-origin cookies.
