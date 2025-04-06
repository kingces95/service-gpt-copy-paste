#!/usr/bin/env node
import { CliService, CliServiceThread } from '@kingjs/cli'
import { 
  CliCommand, CliStdIn, CliStdOut 
} from '@kingjs/cli-command'
import { CliStdMon } from '@kingjs/cli-runtime'
import { CliWriter } from '@kingjs/cli-writer'
import { AbortError } from '@kingjs/abort-error'
import os from 'os'

export class CliDaemonState extends CliService { 
  static services = {
    stdmon: CliStdMon,
  }
  static { this.initialize(import.meta) }

  #console
  #state

  constructor(options) { 
    if (CliDaemonState.initializing(new.target)) 
      return super()
    super(options)

    const { stdmon } = this.getServices(CliDaemonState, options)
    this.#console = stdmon.then(stream => new CliWriter(stream))

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

export class CliServiceMonitor extends CliServiceThread {
  static { this.initialize(import.meta) }

  #intervalMs
  #reportMs

  constructor({ reportMs, intervalMs, ...rest } = {}) {
    if (CliServiceMonitor.initializing(new.target))
      return super()
    super(rest)

    this.#intervalMs = intervalMs
    this.#reportMs = reportMs
  }

  get intervalMs() { return this.#intervalMs }
  get reportMs() { return this.#reportMs }

  async start(signal) {
    const { intervalMs, reportMs } = this
    
    let ms = 0
    let running = true
    let context = await this.report({ ms })
    signal.addEventListener('abort', () => { running = false }, { once: true })
    
    while (running) {
      await new Promise(resolve => setTimeout(resolve, intervalMs))
      if ((ms += intervalMs) < reportMs) continue
      context = await this.report({ ...context, ms })
      ms = 0
    }
  }

  async report() { }
}

export class CliPulse extends CliServiceMonitor {
  static parameters = {
    reportMs: 'Reporting rate',
    intervalMs: 'Cancellation polling rate',
  }
  static services = {
    stdin: CliStdIn,
    stdout: CliStdOut,
  }
  static { this.initialize(import.meta) }

  #stdin
  #stdout

  constructor({ reportMs = 1000, intervalMs = 100, ...rest } = {}) {
    if (CliPulse.initializing(new.target, { reportMs, intervalMs }))
      return super()
    super({ reportMs, intervalMs, ...rest })

    const { stdin, stdout } = this.getServices(CliPulse, rest)
    this.#stdin = stdin
    this.#stdout = stdout
  }

  get stdin() { return this.#stdin }
  get stdout() { return this.#stdout }

  async report({ ms, prevCPU}) {
    if (!prevCPU) return { prevCPU: process.cpuUsage() }

    // cpu usage
    const cpuUsage = process.cpuUsage(prevCPU)
    const userCPU = cpuUsage.user / 1e6
    const systemCPU = cpuUsage.system / 1e6
    const totalCPU = ((userCPU + systemCPU) / (ms / 1000) / os.cpus().length) * 100

    // memory usage
    const memoryUsage = (process.memoryUsage().rss / os.totalmem() * 100).toFixed(1)

    // stream usage
    const stdin = await this.stdin
    const stdout = await this.stdout

    // report
    await this.runtime.emitAsync('pulse', 
      stdin.count, stdout.count, 0, totalCPU.toFixed(1), memoryUsage)

    return { prevCPU: process.cpuUsage() }
  }
}

export class CliDaemon extends CliCommand {
  static services = { 
    state: CliDaemonState, 
    pulse: CliPulse 
  }
  static { this.initialize(import.meta) }

  #state

  constructor(options) {
    if (CliDaemon.initializing(new.target)) 
      return super()

    super(options)
    
    const { state } = this.getServices(CliDaemon, options)
    this.#state = state
    this.runtime.on('pulse', (...record) => { state.update('data', ...record) })
  }

  async execute(signal) {
    const { runtime } = this

    try {
      await runtime.emitAsync('beforeStart')
      const result = await this.start(signal)
      return result

    } catch (error) {
      if (error instanceof AbortError) return
      throw error

    } finally {
      await runtime.emitAsync('afterStart')
    }
  }

  async start(signal) { }

  toString() { return this.#state.toString() }
}

// CliDaemon.__dumpMetadata()
