#!/usr/bin/env node

import { Clipboard } from '@napi-rs/clipboard'
import { interval, timer } from 'rxjs'
import { switchMap, exhaustMap, tap, filter, first, retry, takeUntil } from 'rxjs/operators'
import CliRx from '@kingjs/cli-rx'
import { Cli } from '@kingjs/cli'

class CliPoller extends CliRx {
  static metadata = Object.freeze({
    options: {
      pollMs: { type: 'number', default: 200, description: 'Polling interval in milliseconds.' },
      errorRate: { type: 'number', default: 0.01, description: 'Simulated polling error rate.' },
      errorMs: { type: 'number', default: 1000, description: 'Milliseconds to delay after error.' },
    }
  })

  constructor(options, ...workflow) {
    const { 
      pollMs, 
      errorRate, 
      errorMs, 
      ...rest 
    } = { ...Cli.getDefaults(CliPoller.metadata.options), ...options}
    
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
          this.is$('retrying')
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
      return `${super.toString()} (${this.retryError$})`
    
    return super.toString()
  }  
}

export default class CliPollClipboard extends CliPoller {
  static metadata = Object.freeze({
    name: 'poll',
    description: 'Poll clipboard content',
    options: {
      prefix: { type: 'string', default: '!#/clipboard/', description: 'Prefix to match in clipboard content.' },
    }
  })

  constructor(options) {
    const { 
      prefix, 
      ...rest 
    } = { ...Cli.getDefaults(CliPollClipboard.metadata.options), ...options}
    
    const clipboard = new Clipboard()
    super(rest,
      exhaustMap(async () => clipboard.getText()),
      filter((content) => content.startsWith(prefix)),
      first()
    )

    return this
  }
  
  toString() {
    if (this.succeeded)
      return `Clipboard polling succeeded`

    return super.toString()
  }
}
