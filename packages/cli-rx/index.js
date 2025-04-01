import { CliDaemon } from '@kingjs/cli-daemon'
import { Subject, merge } from 'rxjs'
import { tap, share, takeUntil } from 'rxjs/operators'
import { fromAbortSignal } from '@kingjs/rx-from-abort-signal'
import { AbortError } from '@kingjs/abort-error'
import concatWrite from '@kingjs/rx-concat-write'
import { CliStdErr, CliStdOut } from '@kingjs/cli-command'

export class CliRx extends CliDaemon {
  static { this.initialize(import.meta) }
  static services = [
    CliStdOut,
    CliStdErr,
  ]

  #errorSubject
  #signalRx

  constructor(options = { }, workflow) {
    if (CliRx.initializing(new.target, options))
      return super()
    super(options)

    this.#errorSubject = new Subject()
    this.#signalRx = fromAbortSignal(this.signal).pipe(share())
    
    const stdoutPipeline = workflow.pipe(
      takeUntil(this.#signalRx),
      concatWrite(this.getService(CliStdOut)),
      tap({ complete: () => this.#errorSubject.complete() }),
    )
    const stderrPipeline = this.#errorSubject.pipe(
      concatWrite(this.getService(CliStdErr)),
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
