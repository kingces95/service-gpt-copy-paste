#!/usr/bin/env node

import clipboardy from 'clipboardy'
import { interval, timer } from 'rxjs'
import { switchMap, tap, filter, first, retry, takeUntil } from 'rxjs/operators'
import CliRx from '@kingjs/cli-rx'
import { Cli } from '@kingjs/cli'

class CliPoller extends CliRx {
  static metadata = Object.freeze({
    options: {
      pollMs: { type: 'number', default: 200, describe: 'Polling interval in milliseconds.' },
      errorRate: { type: 'number', default: 0.01, describe: 'Simulated polling error rate.' },
      errorMs: { type: 'number', default: 1000, describe: 'Milliseconds to delay after error.' },
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
          this.is$('retrying', error)
          return timer(errorMs).pipe(takeUntil(this.signal))
        },
      }),
    ))
  }
}

export default class CliPollClipboard extends CliPoller {
  static metadata = Object.freeze({
    name: 'poll',
    description: 'Poll clipboard content',
    options: {
      prefix: { type: 'string', default: '!#/clipboard/', describe: 'Prefix to match in clipboard content.' },
    }
  })

  constructor(options) {
    const { 
      prefix, 
      ...rest 
    } = { ...Cli.getDefaults(CliPollClipboard.metadata.options), ...options}
    
    super(rest,
      switchMap(() => clipboardy.read()),
      filter((content) => content.startsWith(prefix)),
      first()
    )

    return this
  }
  
  toString(state, result) {
    if (Cli.isSuccess(state, result)) {
      return `Clipboard polling succeeded`
    }
    return super.toString(state, result)
  }
}
