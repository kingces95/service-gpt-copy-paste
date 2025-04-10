import { CliService } from '@kingjs/cli-service'
import { CliRx } from '@kingjs/cli-rx'
import { interval, timer } from 'rxjs'
import { switchMap, retry, takeUntil } from 'rxjs/operators'

const POLL_MS = 200
const ERROR_RATE = 0.01
const ERROR_MS = 1000

export class CliRxPollerState extends CliService {
  static consumes = [ 'polling', 'retrying' ]
  static produces = [ 'is', 'warnThat' ]
  static { this.initialize(import.meta) }

  constructor(options) {
    if (CliRxPollerState.initializing(new.target)) 
      return super()
    super(options)

    this.on('polling', () => this.emit('is', 'polling'))
    this.on('retrying', (error) =>
      this.emit('warnThat', 'retrying', `Retrying (${error})...`) 
    )
  }
}

export class CliRxPoller extends CliRx {
  static parameters = {
    pollMs: 'Polling interval',
    errorRate: 'Simulated polling error rate',
    errorMs: 'Retry delay',
    writeError: 'Log service errors to stderr',
  }
  static produces = [ 'polling', 'retrying' ]
  static { this.initialize(import.meta) }

  #pollMs
  #errorRate
  #errorMs
  #writeError

  constructor({ 
    pollMs = POLL_MS,
    errorRate = ERROR_RATE,
    errorMs = ERROR_MS,
    writeError = false,
    ...rest
  } = { }) {
    if (CliRxPoller.initializing(new.target, { 
      pollMs, errorRate, errorMs, writeError }))
      return super()

    super(rest)

    this.#pollMs = pollMs
    this.#errorRate = errorRate
    this.#errorMs = errorMs
    this.#writeError = writeError
  }

  workflow(signalRx) {
    const pollMs = this.#pollMs
    const errorRate = this.#errorRate
    const errorMs = this.#errorMs
    const writeError = this.#writeError

    return interval(pollMs).pipe(
      switchMap(async () => { 
        this.emit('polling')
        if (Math.random() < errorRate) 
          throw new Error('Simulated polling error')
      }),
      this.poll(signalRx),
      retry({
        count: Infinity,
        delay: async (error) => {
          this.emit('retrying', error)
          if (writeError)
            this.writeError(`${error}`)
          return timer(errorMs).pipe(takeUntil(signalRx))
        },
      }),
    )
  }

  poll(signalRx) { }
}

// CliRxPoller.__dumpMetadata()
