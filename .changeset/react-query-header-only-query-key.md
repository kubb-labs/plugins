---
'@kubb/plugin-react-query': patch
---

Stop passing an argument to a query key factory that takes none.

The generated key factory only accepts a parameter when an operation carries path, query, or body
parameters — headers do not identify a cache entry. The hook decided separately, passing
`resolvedParams` whenever the operation had any request group at all, so an operation with only
header parameters generated `useX` calling a zero-argument factory with one argument (`TS2554`).
Both now derive from the same set of request groups.
