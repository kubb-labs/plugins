---
"@kubb/plugin-react-query": patch
---

Classify each operation as query or mutation once and dispatch only to the matching hook generators, instead of running all five (query, suspenseQuery, infiniteQuery, suspenseInfiniteQuery, mutation) for every operation with four returning early. Fixes kubb-labs/kubb#3816. Generated output is unchanged.
