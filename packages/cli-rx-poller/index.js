#!/usr/bin/env node

import { CliService } from '@kingjs/cli'
import { CliRx } from '@kingjs/cli-rx'
import { interval, timer } from 'rxjs'
import { switchMap, retry, takeUntil } from 'rxjs/operators'
import { CliConsoleMon } from '@kingjs/cli-runtime'

const POLL_MS = 200
const ERROR_RATE = 0.01
const ERROR_MS = 1000

export class CliRxPollerState extends CliService {
  static services = {
    console: CliConsoleMon,
  }
  static { this.initialize(import.meta) }

  constructor(options) {
    if (CliRxPollerState.initializing(new.target)) 
      return super()
    super(options)

    const { console } = this.getServices(CliRxPollerState, options)

    const { runtime } = this
    runtime.on('polling', async () => { await console.is('polling') })
    runtime.on('retrying', async (error) => { 
      await console.warnThat('retrying', `Retrying (${error})...`) 
    })
  }
}

export class CliRxPoller extends CliRx {
  static parameters = {
    pollMs: 'Polling interval',
    errorRate: 'Simulated polling error rate',
    errorMs: 'Retry delay',
    writeError: 'Log service errors to stderr',
  }
  static services = {
    state: CliRxPollerState
  }
  static { this.initialize(import.meta) }

  #pollMs
  #errorRate
  #errorMs
  #writeError
  #state

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

    const { state } = this.getServices(CliRxPoller, rest)
    this.#state = state

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
        await this.runtime.emitAsync('polling')
        if (Math.random() < errorRate) 
          throw new Error('Simulated polling error')
      }),
      this.poll(signalRx),
      retry({
        count: Infinity,
        delay: async (error) => {
          await this.runtime.emitAsync('retrying', error)
          if (writeError)
            this.writeError(`${error}`)
          return timer(errorMs).pipe(takeUntil(signalRx))
        },
      }),
    )
  }

  poll(signalRx) { }

  toString() { this.#state.toString() }  
}

// CliRxPoller.__dumpMetadata()
