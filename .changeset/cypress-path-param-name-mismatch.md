---
"@kubb/plugin-cypress": patch
---

Fix the generated request URL to interpolate a path parameter's declared name instead of its path template placeholder text. The two only disagree when a spec's path template and its parameter object use different casing for the same parameter (for example `/pet/{pet_id}/uploadImage` declaring `petId`), in which case the generated client previously failed to typecheck against its own `path` type.
