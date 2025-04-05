#!/usr/bin/env node

import { CliService } from '@kingjs/cli'
import { CliDaemonState } from '@kingjs/cli-daemon'
import { CliRx } from '@kingjs/cli-rx'
import { interval, timer } from 'rxjs'
import { switchMap, retry, takeUntil } from 'rxjs/operators'

const POLL_MS = 200
const ERROR_RATE = 0.01
const ERROR_MS = 1000

export class CliRxPollerState extends CliService {
  static services = {
    daemonState: CliDaemonState,
  }
  static { this.initialize(import.meta) }

  #retryError
  #daemonState

  constructor(options) {
    if (CliRxPollerState.initializing(new.target)) 
      return super()
    super(options)

    const { daemonState } = this.getServices(CliRxPollerState, options)
    this.#daemonState = daemonState

    const { runtime } = this
    runtime.on('polling', async () => { await daemonState.is('polling') })
    runtime.on('retrying', async (error) => { 
      this.#retryError = error
      await daemonState.is('retrying') 
    })
  }

  get currently() { return this.#daemonState.currently }
  get polling() { return this.currently == 'polling' }
  get retrying() { return this.currently == 'retrying' }

  toString() {
    const daemonState = this.#daemonState
    const retryError = this.#retryError

    if (this.retrying)
      return `Retrying (${retryError})...`
    
    return daemonState.toString()
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
        await runtime.emitAsync('polling')
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
