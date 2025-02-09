#!/usr/bin/env node

import { interval, timer } from 'rxjs'
import { switchMap, tap, retry, takeUntil } from 'rxjs/operators'
import CliRx from '@kingjs/cli-rx'

const POLL_MS = 200
const ERROR_RATE = 0.01
const ERROR_MS = 1000

export class CliPoller extends CliRx {
  static metadata = Object.freeze({
    options: {
      pollMs: { type: 'number', default: POLL_MS, description: 'Polling interval in milliseconds.' },
      errorRate: { type: 'number', default: ERROR_RATE, description: 'Simulated polling error rate.' },
      errorMs: { type: 'number', default: ERROR_MS, description: 'Milliseconds to delay after error.' },
      writeError: { type: 'boolean', description: 'Write error messages to stderr.' },
    }
  })

  constructor(options, ...workflow) {
    const { 
      pollMs = POLL_MS, 
      errorRate = ERROR_RATE, 
      errorMs = ERROR_MS, 
      writeError,
      ...rest 
    } = options
    
    super(rest, interval(pollMs).pipe(
      tap(() => this.is$('polling')),
      switchMap(async () => { 
        if (Math.random() < errorRate) {
          throw new Error('Simulated polling error')
        }
      }),
      ...workflow,
      retry({
        count: Infinity,
        delay: (error) => {
          this.retryError$ = error
          this.warnThat$('retrying')
          if (writeError)
            this.writeError(`${error}`)
          return timer(errorMs).pipe(takeUntil(this.signalRx))
        },
      }),
    ))

    this.retryError$ = null
  }

  get polling() { return this.state$ == 'polling' }
  get retrying() { return this.state$ == 'retrying' }

  toString() {
    if (this.retrying)
      return `Retrying (${this.retryError$})...`
    
    return super.toString()
  }  
}
