#!/usr/bin/env node

import { Subject, merge } from 'rxjs'
import { tap, share, takeUntil } from 'rxjs/operators'
import fromAbortSignal from '@kingjs/rx-from-abort-signal'
import concatWrite from '@kingjs/rx-concat-write'
import { Cli } from '@kingjs/cli'

export default class CliRx extends Cli {
  constructor({ signal, ...rest }, workflow) {
    super({ signal, ...rest })

    this.errorSubject = new Subject()
    
    const signalRx = fromAbortSignal(signal).pipe(share())
    
    const stdoutPipeline = workflow.pipe(
      takeUntil(signalRx),
      concatWrite(this.stdout),
      tap({ complete: () => this.errorSubject.complete() }),
    )
  
    const stderrPipeline = this.errorSubject.pipe(
      concatWrite(this.stderr)
    )
  
    merge(stdoutPipeline, stderrPipeline).subscribe({
      complete: () => {
        this.success$()
      },
      error: (err) => {
        this.error$(err)
      },
    })
  }

  writeError(data) {
    this.errorSubject.next(data)
  }
}

