const SIGNALS = ['SIGINT', 'SIGTERM', 'SIGHUP'] as const

export function onProcessExit(callback: (code: number | null) => void): () => void {
  const exitHandler = (code: number) => callback(code)
  const signalHandlers = new Map<string, () => void>()
  const count = SIGNALS.length + 1

  process.setMaxListeners(process.getMaxListeners() + count)

  for (const signal of SIGNALS) {
    const handler = () => {
      unsubscribe()
      try {
        callback(null)
      } finally {
        process.kill(process.pid, signal)
      }
    }
    signalHandlers.set(signal, handler)
    process.on(signal, handler)
  }

  process.on('exit', exitHandler)

  function unsubscribe() {
    process.removeListener('exit', exitHandler)
    for (const [signal, handler] of signalHandlers) {
      process.removeListener(signal, handler)
    }
    process.setMaxListeners(Math.max(1, process.getMaxListeners() - count))
  }

  return unsubscribe
}
