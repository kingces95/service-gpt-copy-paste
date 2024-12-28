import { Observable } from 'rxjs'
import { tap, share } from 'rxjs/operators';
import { takeUntil } from 'rxjs/operators';
import { PassThrough } from 'stream';
import { EventEmitter } from 'events';


class Spawn extends EventEmitter {
  static State = Object.freeze({
    IDLEING: 'idleing',
    STARTING: 'starting',
    ERROR: 'error',
    END: 'end',
  })

  static getDefaults(options) {
    return Object.fromEntries(
      Object.entries(options).map(([key, { default: value }]) => [key, value])
    )
  }

  static fromSignal(signal) {
    return new Observable((subscriber) => {
      const onAbort = () => subscriber.complete()
      signal.addEventListener('abort', onAbort, { once: true })
      return () => signal.removeEventListener('abort', onAbort)
    }).pipe(share())
  }

  static async write(stream, data) {
    if (!stream.write(data)) {
      await new Promise((resolve) => stream.once('drain', resolve))
    }
  }

  constructor(signal) {
    super()
    this.stdout = new PassThrough()
    this.stderr = new PassThrough()
    this.state = Spawn.State.IDLEING
    this.status
    this.isAborting = false

    // gather stats on bytes transmitted through the streams
    this.bytes = { stdout: 0, stderr: 0 }
    this.stdout.on('data', (chunk) => (this.bytes.stdout += chunk.length))
    this.stderr.on('data', (chunk) => (this.bytes.stderr += chunk.length))
    
    this.abortNotifier = Spawn.fromSignal(signal).pipe(
      tap(() => (this.isAborting = true))
    )
  }

  update(state, metadata) {
    this.state = state
    this.status = metadata
  }

  async writeOut(data) {
    await Spawn.write(this.stdout, data)
  }

  async writeError(data) {
    await Spawn.write(this.stderr, data)
  }

  start(workflow) {
    this.update(Spawn.State.STARTING)
    return workflow.pipe(takeUntil(this.abortNotifier)).subscribe({
      next: (data) => {
        this.update(Spawn.State.END, data)
        this.emit('end', data)
      },
      error: async (err) => {
        this.update(Spawn.State.ERROR, err)
        this.emit('error', err)
        await this.closeStreams()
      },
      complete: async () => {
        await this.closeStreams()
      },
    })
  }

  async closeStreams() {
    const finishPromise = (stream) => new Promise((resolve) => stream.once('finish', resolve))
    this.stdout.end()
    this.stderr.end()
    await Promise.all([
      finishPromise(this.stdout),
      finishPromise(this.stderr),
    ])
    this.emit('close', this.bytes)
  }

  
  toString() {
    switch (this.state) {
      case Spawn.State.END:
        return `Success`
      case Spawn.State.ERROR:
        if (!this.status)
          return 'Internal errror'
        return this.status.toString()
      default:
        return `${this.state.charAt(0).toUpperCase() + this.state.slice(1)}...`
    }
  }
}

export default Spawn;
