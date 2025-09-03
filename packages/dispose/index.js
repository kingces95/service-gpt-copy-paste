import { assert } from '@kingjs/assert'
import { once } from 'events'
import { sleep } from '@kingjs/sleep'
import { pause } from '@kingjs/pause'
import { AbortError } from '@kingjs/abort-error'
import { TimeoutError } from '@kingjs/timeout-error'

function toError(x) {
  if (x instanceof Error) 
    return x

  if (Array.isArray(x)) {
    if (x.length == 0) return new Error('Errors array is empty')
    if (x.length == 1) return toError(x[0])
    return new AggregateError(x.map(toError), 'Multiple errors')
  }

  return new Error(typeof x === 'string' ? x : JSON.stringify(x))
}

export async function dispose(resource, { 
  disposeFn, 
  disposedFn,
  event, 
  signal,
  timeoutMs
} = { }) {
  disposeFn ??= () => { }
  disposedFn ??= () => false

  // check if resource needs to be disposed
  if (disposedFn(resource))
    return

  // synchronous disposal; no disposal event
  if (!event) {
    disposeFn(resource)
    return
  }

  // asynchronous disposal; synchronize with disposal event
  const disposed = once(resource, event)

  // trap for any errors that occur during disposal
  let errorResult
  const error = once(resource, 'error')
    .then(e => errorResult = toError(e))

  // initiate disposal
  await disposeFn(resource)

  // abort after a timeout
  let timeoutResult
  const timeout = !timeoutMs ? null : sleep(timeoutMs)
    .then(() => timeoutResult = true)

  // abort if signaled
  let abortResult
  let handler = null
  const abort = !signal ? null : new Promise(
    resolve => {
      if (signal.aborted) resolve()
      else signal.addEventListener('abort', handler = resolve)
    }).then(pause()).then(() => abortResult = true)

  try { 
    // wait for dispose, abort, or timeout
    await Promise.any(
      [ disposed, abort, error, timeout ].filter(Boolean)
    )
    if (abortResult) throw new AbortError()
    if (timeoutResult) throw new TimeoutError()
    if (errorResult) throw errorResult
  } 
  finally { 
    signal?.removeEventListener('abort', handler) 
  }
}
