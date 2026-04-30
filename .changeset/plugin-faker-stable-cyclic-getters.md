---
'@kubb/plugin-faker': patch
---

Fix cyclic-schema getters so property values are stable and construction never stack-overflows.

Previously, objects with circular references (e.g. `Cat → Pet → Cat`) used plain lazy getters that both (a) called the recursive faker factory on every property access – returning a different random value each time – and (b) triggered infinite recursion when the object was spread during construction.

The generated code now emits **memoizing getters**: on first access the value is computed, stored via `Object.defineProperty`, and returned; every subsequent access returns the cached value. The function body no longer spreads the object literal (which would invoke the getters), instead returning it directly and merging user-supplied `data` overrides through `Object.defineProperty` so that getter-only properties can be replaced without a setter.

Result: `myCat.archEnemy === myCat.archEnemy` is now always `true`, and calling `cat()` no longer risks a stack overflow.
