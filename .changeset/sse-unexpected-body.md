---
'@kubb/plugin-client': minor
'@kubb/plugin-fetch': minor
'@kubb/plugin-axios': minor
---

Make a stream call fail loudly on an answer that is not an event stream.

- A successful answer whose body is not a stream, such as a JSON body, now throws a `TypeError` with the decoded body as its `cause`. It used to return an empty stream and lose the body.
- A streamed body is parsed as server-sent events whatever its content type says, as in earlier releases, so a server or proxy that drops the `text/event-stream` header still delivers its events.
- An event the server ends without a blank line is now dropped, as the WHATWG event stream specification and browser `EventSource` do. End each event with a blank line, including the last one.
