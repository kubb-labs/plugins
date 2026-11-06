# Live tests

Generates fetch and axios clients from four documents and runs them against real servers, so the shared client runtime is checked end to end: serialization, auth, error handling, interceptors, binary bodies, and Server-Sent Events.

| Document               | Server                           | What it covers                                                                       |
| ---------------------- | -------------------------------- | ------------------------------------------------------------------------------------ |
| `specs/petstore3.json` | `petstore3.swagger.io`           | JSON CRUD with `bigint` ids, 404 under each `throwOnError` mode, octet-stream upload |
| `specs/httpbin.yaml`   | `httpbin.org`                    | Query styles, forms, multipart, auth schemes, cookies, redirects, gzip, 204, binary  |
| `specs/wikimedia.yaml` | `stream.wikimedia.org`           | A live SSE feed: iteration, `lastEventId`, `Last-Event-ID` resume, abort, a 400      |
| `specs/local-sse.yaml` | `tests/server.ts` on `127.0.0.1` | Typed events, `[DONE]`, CRLF, comments, multi-line data, a dropped connection, 406   |

Run it from the repository root:

```bash
pnpm --filter tests-live test
```

The root `pnpm test` leaves these suites out, because they need the network. `gen/` is generated on each run and is not committed.
