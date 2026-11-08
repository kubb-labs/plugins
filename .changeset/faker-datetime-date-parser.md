---
'@kubb/plugin-faker': patch
---

Format `date-time` fields with `dateParser`, as the option already promises. With `dateParser: 'dayjs'`, a `format: date-time` field now prints `dayjs(faker.date.anytime()).format("YYYY-MM-DDTHH:mm:ss[Z]")` and keeps the `dayjs` import, instead of ignoring the option. The format follows the adapter `dateType`: `stringOffset` adds a numeric offset and `stringLocal` drops the zone. The default `dateParser: 'faker'` output does not change.
