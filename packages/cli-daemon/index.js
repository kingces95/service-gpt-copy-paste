#!/usr/bin/env node
import { CliService } from '@kingjs/cli'
import { 
  CliCommand, CliStdIn, CliStdOut, CliStdLog 
} from '@kingjs/cli-command'
import { CliWriter } from '@kingjs/cli-writer'
import { AbortError } from '@kingjs/abort-error'
import os from 'os'
import assert from 'assert'

export class CliDaemonState extends CliService { 
  static services = {
    stdlog: CliStdLog,
  }
  static { this.initialize(import.meta) }

  #console
  #state

  constructor(options) { 
    if (CliDaemonState.initializing(new.target)) 
      return super()
    super(options)

    const { stdlog } = this.getServices(CliDaemonState, options)
    this.#console = stdlog.then(stdlog => new CliWriter(stdlog))

    const { runtime } = this
    runtime.once('beforeExecute', async () => { await this.is('initializing') })
    runtime.once('beforeStart', async () => { 
      await this.is('starting') 
    })
    runtime.once('beforeAbort', async () => { await this.is('aborting') })
    runtime.once('afterStart', async () => { await this.is('stopping') })
    runtime.once('beforeExit', async () => {
      await this.update('exiting', runtime.exitCode)
      await this.is(
        runtime.succeeded ? 'succeeded' :
        runtime.aborted ? 'aborted' :
        runtime.errored ? 'errored' :
        'failed'
      )
    })
  }

  get currently() { return this.#state }
  get starting() { return this.currently == 'starting' }
  get aborting() { return this.currently == 'aborting' }
  get stopping() { return this.currently == 'stopping' }

  async update(...fields) {
    await (await this.#console).echoRecord(fields)
  }

  async warnThat(name) {
    this.#state = name
    await this.update('warning', name, this.toString())
  }
  
  async is(name) {
    this.#state = name
    await this.update(name, this.toString())
  }  

  toString() {
    const state = this.currently
    return state.charAt(0).toUpperCase() + state.slice(1) + '...'
  }
}

export class CliPulse extends CliService {
  static parameters = {
    reportMs: 'Heartrate',
    intervalMs: 'Cancellation polling',
  }
  static services = {
    stdin: CliStdIn,
    stdout: CliStdOut,
  }
  static { this.initialize(import.meta) }

  #stdin
  #stdout
  #running
  #intervalMs
  #reportMs

  constructor({ reportMs = 1000, intervalMs = 100, ...rest } = {}) {
    if (CliPulse.initializing(new.target, { reportMs, intervalMs }))
      return super()
    super(rest)

    const { stdin, stdout } = this.getServices(CliPulse, rest)
    this.#stdin = stdin
    this.#stdout = stdout
    this.#running = false
    this.#intervalMs = intervalMs
    this.#reportMs = reportMs
  }

  get stdin() { return this.#stdin }
  get stdout() { return this.#stdout }
  get intervalMs() { return this.#intervalMs }
  get reportMs() { return this.#reportMs }

  async start(callback) {
    const { intervalMs, reportMs } = this

    let ms = 0
    let prevCPU = process.cpuUsage()
    this.#running = true
    
    while (this.#running) {
      await new Promise(resolve => setTimeout(resolve, intervalMs))
      ms += intervalMs
      if (ms < reportMs) 
        continue
      
      const cpuUsage = process.cpuUsage(prevCPU)
      prevCPU = process.cpuUsage()
      
      const userCPU = cpuUsage.user / 1e6
      const systemCPU = cpuUsage.system / 1e6
      const totalCPU = ((userCPU + systemCPU) / (ms / 1000) / os.cpus().length) * 100

      const memoryUsage = (process.memoryUsage().rss / os.totalmem() * 100).toFixed(1)

      const stdin = await this.stdin
      const stdout = await this.stdout
      callback(stdin.count, stdout.count, 0, totalCPU.toFixed(1), memoryUsage)
      ms = 0
    }
  }

  async stop() {
    this.#running = false
  }
}

export class CliDaemon extends CliCommand {
  static services = { 
    state: CliDaemonState, 
    pulse: CliPulse 
  }
  static { this.initialize(import.meta) }

  #state
  #pulse

  constructor(options) {
    if (CliDaemon.initializing(new.target)) 
      return super()

    super(options)
    
    const { state, pulse } = this.getServices(CliDaemon, options)
    this.#state = state
    this.#pulse = pulse
  }

  async execute(signal) {
    const { runtime } = this
    const pulse = this.#pulse
    const state = this.#state

    pulse.start((...record) => { state.update('data', ...record) })
    
    try {
      await runtime.emitAsync('beforeStart')
      const result = await this.start(signal)
      assert(!state.aborting)
      return result

    } catch (error) {
      if (error instanceof AbortError) { assert(state.aborting); return } 
      assert(!state.aborting)
      throw error

    } finally {
      await pulse.stop() 
      await runtime.emitAsync('afterStart')
    }
  }

  async start(signal) { }

  toString() { return this.#state.toString() }
}

// CliDaemon.__dumpMetadata()
