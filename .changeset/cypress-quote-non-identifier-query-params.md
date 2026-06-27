---
"@kubb/plugin-cypress": patch
---

Quote query-parameter keys in the generated `qs` object. Parameter names that are not valid JavaScript identifiers (for example `age-group`, `list.name`, or `x-amz-*`) were emitted as bare object keys, producing a syntax error in the generated Cypress request. The keys are now quoted, matching how header parameters were already handled.
