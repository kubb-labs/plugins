/**
 * A JSON-RPC 2.0 message as the TypeScript content mapper host sends and expects it.
 */
export type Message = {
  id?: number | string
  method?: string
  params?: unknown
  result?: unknown
  error?: { code: number; message: string }
}

const separator = '\r\n\r\n'

/**
 * Frames a message with the LSP base protocol `Content-Length` header the host reads.
 */
export function encode(message: Message): Buffer {
  const body = Buffer.from(JSON.stringify({ jsonrpc: '2.0', ...message }))

  return Buffer.concat([Buffer.from(`Content-Length: ${body.length}${separator}`), body])
}

/**
 * Returns a stream handler that collects `Content-Length` framed chunks and calls `onMessage`
 * once per complete message, however the chunks split the frames.
 */
export function createDecoder(onMessage: (message: Message) => void): (chunk: Buffer) => void {
  let buffer = Buffer.alloc(0)

  return (chunk) => {
    buffer = Buffer.concat([buffer, chunk])

    while (true) {
      const headerEnd = buffer.indexOf(separator)
      if (headerEnd === -1) return

      const header = buffer.subarray(0, headerEnd).toString()
      const length = Number(/content-length:\s*(\d+)/i.exec(header)?.[1])
      if (!Number.isInteger(length)) throw new Error(`Missing Content-Length header in "${header}"`)

      const start = headerEnd + separator.length
      if (buffer.length < start + length) return

      const body = buffer.subarray(start, start + length).toString()
      buffer = buffer.subarray(start + length)
      onMessage(JSON.parse(body) as Message)
    }
  }
}
