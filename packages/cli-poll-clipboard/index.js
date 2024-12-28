#!/usr/bin/env node

import clipboardy from 'clipboardy'
import { interval, timer, Subject, merge } from 'rxjs'
import { switchMap, tap, filter, first, retry, share, takeUntil } from 'rxjs/operators'
import fromAbortSignal from '@kingjs/rx-from-abort-signal'
import concatWrite from '@kingjs/rx-concat-write'
import { Cli } from '@kingjs/cli'
import { CliShim } from '@kingjs/cli-loader'

class CliRx extends Cli {
  constructor(options) {
    const { signal, ...rest } = options
    super(rest)

    this.signal = fromAbortSignal(signal).pipe(share())
    this.errorSubject = new Subject()
  }

  writeError(data) {
    this.errorSubject.next(data)
  }

  start(workflow) {
    this.is$('starting')

    const stdoutPipeline = workflow.pipe(
      takeUntil(this.signal),
      concatWrite(this.stdout),
      tap({ complete: () => this.errorSubject.complete() }),
    )

    const stderrPipeline = this.errorSubject.pipe(
      concatWrite(this.stderr)
    )

    return merge(stdoutPipeline, stderrPipeline).subscribe({
      complete: () => {
        this.success$()
      },
      error: (err) => {
        this.error$(err)
      },
    })
  }
}

class CliPoller extends CliRx {
  static metadata = Object.freeze({
    options: {
      pollMs: { type: 'number', default: 200, describe: 'Polling interval in milliseconds.' },
      errorRate: { type: 'number', default: 0.01, describe: 'Simulated polling error rate.' },
      errorMs: { type: 'number', default: 1000, describe: 'Milliseconds to delay after error.' },
    }
  })

  constructor(options) {
    const { 
      pollMs, 
      errorRate, 
      errorMs, 
      ...rest 
    } = { ...Cli.getDefaults(CliPoller.metadata.options), ...options}
    
    super(rest)
    this.pollMs = pollMs
    this.errorRate = errorRate
    this.errorMs = errorMs
  }

  startPolling(...workflow) {
    const pollingWorkflow = interval(this.pollMs).pipe(
      tap(() => this.is$('polling')),
      switchMap(async () => {
        if (Math.random() < this.errorRate) {
          throw new Error('Simulated polling error')
        }
      }),
      ...workflow,
      retry({
        count: Infinity,
        delay: (error) => {
          this.is$('retrying', error)
          return timer(this.errorMs).pipe(takeUntil(this.signal))
        },
      }),
    )

    this.start(pollingWorkflow)
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
    
    super(rest)
    this.prefix = prefix

    this.startPolling(
      switchMap(() => clipboardy.read()),
      filter((content) => content.startsWith(this.prefix)),
      first(),
    )
  }
  
  toString(state, result) {
    if (Cli.isSuccess(state, result)) {
      return `Clipboard polling succeeded`
    }
    return super.toString(state, result)
  }
}

CliShim.runIf(import.meta.url, CliPollClipboard)
