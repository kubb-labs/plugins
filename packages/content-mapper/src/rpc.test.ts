import { describe, expect, test } from 'vitest'
import { createDecoder, encode, type Message } from './rpc.ts'

describe('rpc', () => {
  test('decodes messages however the chunks split the frames', () => {
    const messages: Array<Message> = []
    const decode = createDecoder((message) => messages.push(message))
    const stream = Buffer.concat([encode({ id: 1, method: 'initialize' }), encode({ id: 2, method: 'transform', params: { content: 'é' } })])

    for (let i = 0; i < stream.length; i += 3) {
      decode(stream.subarray(i, i + 3))
    }

    expect(messages).toStrictEqual([
      { jsonrpc: '2.0', id: 1, method: 'initialize' },
      { jsonrpc: '2.0', id: 2, method: 'transform', params: { content: 'é' } },
    ])
  })

  test('throws on a frame without a Content-Length header', () => {
    const decode = createDecoder(() => {})

    expect(() => decode(Buffer.from('X-Other: 1\r\n\r\n{}'))).toThrow('Missing Content-Length')
  })
})
