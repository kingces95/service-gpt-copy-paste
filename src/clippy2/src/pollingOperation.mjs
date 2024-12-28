import { interval, from, timer, race } from 'rxjs'
import { switchMap, filter, first, retry, tap, takeUntil } from 'rxjs/operators'
import Operation from './Operation.mjs'

// Default timer utilities (can be overridden for testing)
const defaultTimers = {
  interval,
  timer,
}

class PollingOperation extends Operation {
  constructor(signal, options = { }) {
    super(signal)
    this.options = {
      pollMs: options.pollMs || 200,
      retryMs: options.retryMs || 200,
      maxRetryMs: options.maxRetryMs || 2000,
      retries: options.retries || Infinity,
      test: options.test || (() => true),
      timers: options.timers || defaultTimers,
      readFn: options.readFn,
    }

    const { pollMs, retryMs, maxRetryMs, retries, test, timers, readFn } = this.options
    const { interval, timer } = timers

    const abortNotifier = from(new Promise((resolve) => {
      if (signal) signal.addEventListener('abort', resolve, { once: true })
    }))

    interval(pollMs).pipe(
      switchMap(() => from(readFn())),
      tap((content) => this.out.write({ event: 'poll', content })),
      filter((content) => test(content)),
      first(),
      retry({
        count: retries,
        delay: (error, count) => {
          const backoff = Math.min(retryMs * 2 ** count, maxRetryMs)
          //this.err.write({ event: 'retry', error, count, backoff })
          return race(
            timer(backoff),
            abortNotifier.pipe(tap(() => { throw error }))
          )
        }
      }),
      takeUntil(abortNotifier)
    ).subscribe({
      next: (script) => this.end(script),
      error: (err) => {
        this.err.write({ event: 'error', error: err.message })
        this.end()
      }
    })
  }

  static create(signal, options = {}, timers = defaultTimers, readFn = () => {}) {
    return new PollingOperation(signal, options, timers, readFn)
  }
}

export default PollingOperation
