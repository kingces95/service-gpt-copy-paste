export function awaitEvent(emitter, event, timeoutMs = 1000) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => 
      reject(new Error(`Timed out waiting for '${event}'`)), timeoutMs)

    const cleanup = () => {
      clearTimeout(timeout)
      emitter.off(event, onEvent)
      emitter.off('error', onError)
    }

    const onEvent = (...args) => { cleanup(); resolve(...args) }
    const onError = err => { cleanup(); reject(err) }
    
    emitter.once(event, onEvent)
    emitter.once('error', onError)
  })
}
