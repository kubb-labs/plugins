import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import type { AddressInfo } from 'node:net'

/**
 * A small SSE server with the behaviors no public API offers on demand: typed events, a `[DONE]` terminator,
 * CRLF lines, comments, multi-line data, `retry`, a dropped connection, and resume from `Last-Event-ID`.
 * It answers 406 unless the request accepts `text/event-stream`, as Wikimedia EventStreams does.
 */
export async function startSseServer(): Promise<{ baseURL: string; close: () => Promise<void>; requests: Array<IncomingMessage> }> {
  const requests: Array<IncomingMessage> = []
  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

  const server = createServer(async (req, res) => {
    requests.push(req)
    const url = new URL(req.url ?? '/', 'http://127.0.0.1')
    if (!(req.headers.accept ?? '').includes('text/event-stream')) {
      res.writeHead(406, { 'content-type': 'application/json' })
      return res.end(JSON.stringify({ message: `Not Acceptable: ${req.headers.accept}` }))
    }
    if (url.pathname === '/chat' && req.method === 'POST') return chat(req, res)
    if (url.pathname === '/feed') return feed(req, res, url)
    res.writeHead(404, { 'content-type': 'text/plain' })
    res.end('no such stream')
  })

  async function readJson(req: IncomingMessage): Promise<unknown> {
    let text = ''
    for await (const chunk of req) text += chunk
    return text ? JSON.parse(text) : undefined
  }

  function sseHead(res: ServerResponse) {
    res.writeHead(200, { 'content-type': 'text/event-stream; charset=utf-8', 'cache-control': 'no-cache', connection: 'keep-alive' })
    res.flushHeaders()
  }

  async function chat(req: IncomingMessage, res: ServerResponse) {
    const body = (await readJson(req)) as { prompt?: string } | undefined
    if (body?.prompt === 'bad') {
      res.writeHead(400, { 'content-type': 'application/json' })
      return res.end(JSON.stringify({ message: 'bad prompt' }))
    }
    if (body?.prompt === 'json') {
      res.writeHead(200, { 'content-type': 'application/json' })
      return res.end(JSON.stringify({ answer: 'whole body' }))
    }
    sseHead(res)
    res.write(': hello from the server\n\n')
    res.write('event: message_delta\nid: 1\ndata: {"text":"Hel","index":0}\n\n')
    await sleep(20)
    res.write('event: ping\r\ndata: keep-alive\r\n\r\n')
    res.write('event: message_delta\nid: 2\nretry: 5000\ndata: {"text":"lo",\ndata: "index":1}\n\n')
    await sleep(20)
    res.write('data: [DONE]\n\n')
    res.write('event: message_delta\nid: 3\ndata: {"text":"after done","index":2}\n\n')
    res.end()
  }

  async function feed(req: IncomingMessage, res: ServerResponse, url: URL) {
    const count = Number(url.searchParams.get('count') ?? 5)
    const drop = Number(url.searchParams.get('drop') ?? 0)
    const padding = Number(url.searchParams.get('padding') ?? 0)
    const start = Number(req.headers['last-event-id'] ?? 0) + 1
    sseHead(res)
    for (let n = start; n <= count; n++) {
      if (drop && n > drop) {
        // A drop in the middle of an event: the parser must not report its id as the last event ID.
        res.write(`id: ${n}\ndata: {"n":${n},`)
        res.destroy()
        return
      }
      res.write(`id: ${n}\ndata: {"n":${n},"text":"${'x'.repeat(padding)}"}\n\n`)
      await sleep(10)
    }
    res.end()
  }

  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const { port } = server.address() as AddressInfo
  return {
    baseURL: `http://127.0.0.1:${port}`,
    requests,
    close: () => new Promise((resolve) => server.close(() => resolve())),
  }
}
