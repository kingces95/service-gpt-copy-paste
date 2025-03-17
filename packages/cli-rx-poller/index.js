#!/usr/bin/env node

import { CliCommand } from '@kingjs/cli-command'
import { CliRx } from '@kingjs/cli-rx'
import { interval, timer } from 'rxjs'
import { switchMap, tap, retry, takeUntil } from 'rxjs/operators'

const POLL_MS = 200
const ERROR_RATE = 0.01
const ERROR_MS = 1000

export class CliRxPoller extends CliRx {
  static parameters = {
    pollMs: 'Polling interval in milliseconds.',
    errorRate: 'Simulated polling error rate.',
    errorMs: 'Milliseconds to delay after error.',
    writeError: 'Write error messages to stderr.',
  }
  static { this.initialize() }

  constructor({ 
    pollMs = POLL_MS,
    errorRate = ERROR_RATE,
    errorMs = ERROR_MS,
    writeError = false,
    ...rest
  } = { }, ...workflow) {
    if (CliRxPoller.initializing(new.target, { pollMs, errorRate, errorMs, writeError }))
      return super()

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

// CliRxPoller.__dumpMetadata()
