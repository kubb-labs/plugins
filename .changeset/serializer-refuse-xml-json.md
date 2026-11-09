---
'@kubb/plugin-client': patch
'@kubb/plugin-fetch': patch
'@kubb/plugin-axios': patch
---

Throw a `TypeError` when a call sends an object as XML, YAML, or CSV without a codec. Before, the default serializer sent the object as JSON under that content type, so a server such as the Swagger Petstore answered 400. Pass the encoded body as a string or register `codecs['application/xml'].serialize`. Other content types keep the JSON fallback.
