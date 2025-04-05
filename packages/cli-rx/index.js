import { CliDaemon } from '@kingjs/cli-daemon'
import { Subject, merge } from 'rxjs'
import { tap, share, takeUntil } from 'rxjs/operators'
import { fromAbortSignal } from '@kingjs/rx-from-abort-signal'
import concatWrite from '@kingjs/rx-concat-write'
import { CliStdOut } from '@kingjs/cli-command'

export class CliRx extends CliDaemon {
  static { this.initialize(import.meta) }
  static services = {
    stdout: CliStdOut,
  }

  #errorSubject
  #stdout
  #stderr

  constructor(options = { }) {
    if (CliRx.initializing(new.target, options))
      return super()
    super(options)

    const { stdout } = this.getServices(CliRx, options)
    this.#stdout = stdout
    this.#stderr = stdout

    this.#errorSubject = new Subject()
  }

  async start(signal) {
    const stdout = this.#stdout
    const stderr = this.#stderr
    const errorSubject = this.#errorSubject

    const signalRx = fromAbortSignal(signal).pipe(share())
    const stdoutPipeline = this.workflow(signalRx).pipe(
      takeUntil(signalRx),
      concatWrite(await stdout),
      tap({ complete: () => errorSubject.complete() }),
    )
    const stderrPipeline = errorSubject.pipe(
      concatWrite(await stderr),
    )
    const pipeline = merge(stdoutPipeline, stderrPipeline)

    // imperative => reactive
    await new Promise((resolve, reject) => {
      pipeline.subscribe({ complete: resolve, error: reject })
    }) 
  }

  workflow(signalRx) { }

  writeError(data) {
    this.#errorSubject.next(data)
  }
}

// CliRx.__dumpMetadata()
