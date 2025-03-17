#!/usr/bin/env node

import { CliCommand } from '@kingjs/cli-command'
import { CliService } from '@kingjs/cli-service'
import { Subject, merge } from 'rxjs'
import { tap, share, takeUntil } from 'rxjs/operators'
import { fromAbortSignal } from '@kingjs/rx-from-abort-signal'
import { AbortError } from '@kingjs/abort-error'
import concatWrite from '@kingjs/rx-concat-write'

export class CliRx extends CliService {
  static { this.initialize() }

  constructor(options = { }, workflow) {
    if (CliRx.initializing(new.target, options))
      return super()

    super(options)

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

// CliRx.__dumpMetadata()
