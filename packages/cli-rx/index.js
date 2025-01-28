#!/usr/bin/env node

import { Subject, merge } from 'rxjs'
import { tap, share, takeUntil } from 'rxjs/operators'
import { AbortError, fromAbortSignal } from '@kingjs/rx-from-abort-signal'
import concatWrite from '@kingjs/rx-concat-write'
import { Cli } from '@kingjs/cli'

export default class CliRx extends Cli {
  constructor(args, workflow) {
    super(args)

    this.errorSubject = new Subject()
    
    this.signalRx = fromAbortSignal(this.signal).pipe(share())
    
    const stdoutPipeline = workflow.pipe(
      takeUntil(this.signalRx),
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
        if (err instanceof AbortError)
          this.abort$()
        else
          this.error$(err)
      },
    })
  }

  writeError(data) {
    this.errorSubject.next(data)
  }
}

