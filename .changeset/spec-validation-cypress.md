---
'@kubb/plugin-cypress': patch
---

A `style: cookie` parameter explodes by default, like the generated clients: an array sends `ids=x; ids=y` and an object `id=abc; lang=en`. With `explode: false` the values still join with commas.
