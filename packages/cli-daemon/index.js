#!/usr/bin/env node
import { CliService } from '@kingjs/cli'
import { 
  CliCommand, CliStdIn, CliStdOut, CliStdErr, CliStdLog 
} from '@kingjs/cli-command'
import { CliEcho } from '@kingjs/cli-echo'
import os from 'os'
import assert from 'assert'

export class CliDaemonState extends CliService { 
  static services = {
    stdlog: CliStdLog,
  }
  static { this.initialize(import.meta) }

  #console

  constructor(options) { 
    if (CliDaemonState.initializing(new.target)) 
      return super()
    super(options)

    const { stdlog } = this.getServices(CliDaemonState, options)
    this.#console = new CliEcho(stdlog)
  }

  get state() { return this._state }

  async update(...fields) {
    await this.#console.echoRecord(fields)
  }

  async warnThat(name) {
    this._state = name
    await this.update('warning', name, this.toString())
  }
  
  async is(name) {
    this._state = name
    await this.update(name, this.toString())
  }  

  toString() {
    const state = this.state
    return state.charAt(0).toUpperCase() + state.slice(1) + '...'
  }
}

export class CliPulse extends CliService {
  static parameters = {
    intervalMs: 'Cancellation polling',
    reportMs: 'Report interval',
  }
  static services = {
    stdin: CliStdIn,
    stdout: CliStdOut,
    stderr: CliStdErr,
  }
  static { this.initialize(import.meta) }

  #stdin
  #stdout
  #stderr

  constructor({ intervalMs = 100, reportMs = 1000, ...rest } = {}) {
    if (CliPulse.initializing(new.target, { intervalMs, reportMs }))
      return super()
    super(rest)

    const { stdin, stdout, stderr } = this.getServices(CliPulse, rest)
    this.#stdin = stdin
    this.#stdout = stdout
    this.#stderr = stderr
    this.running = false
    this.intervalMs = intervalMs
    this.reportMs = reportMs
  }

  async start(callback) {
    let ms = 0
    let prevCPU = process.cpuUsage()
    this.running = true
    
    while (this.running) {
      await new Promise(resolve => setTimeout(resolve, this.intervalMs))
      ms += this.intervalMs
      if (ms < this.reportMs) 
        continue
      
      const cpuUsage = process.cpuUsage(prevCPU)
      prevCPU = process.cpuUsage()
      
      const userCPU = cpuUsage.user / 1e6
      const systemCPU = cpuUsage.system / 1e6
      const totalCPU = ((userCPU + systemCPU) / (ms / 1000) / os.cpus().length) * 100

      const memoryUsage = (process.memoryUsage().rss / os.totalmem() * 100).toFixed(1)

      const stdin = await this.#stdin
      const stdout = await this.#stdout
      const stderr = await this.#stderr
      callback(stdin.count, stdout.count, stderr.count,
        totalCPU.toFixed(1), memoryUsage)
      ms = 0
    }
  }

  async stop() {
    this.running = false
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

    const abortController = new AbortController()
    this.signal = abortController.signal

    process.once('SIGINT', async () => {
      await this.is$('aborting')
      abortController.abort()
    })

    process.once('beforeExit', async () => {
      const code = process.exitCode
      assert(code !== undefined)
      await this.update$('exiting', code)

      await this.is$(
        this.succeeded ? 'succeeded' :
        this.aborted ? 'aborted' :
        this.errored ? 'errored' :
        'failed'
      )
    })

    this.#pulse.start((stdinCount, stdoutCount, stderrCount, cpu, memory) => {
      this.update$('data', stdinCount, stdoutCount, stderrCount, cpu, memory)
    })
    this.is$('starting')
  }

  get state$() { return this.#state.state }
  async update$(...fields) { await this.#state.update(...fields) }
  async warnThat$(name) { await this.#state.warnThat(name) } 
  async is$(name) { await this.#state.is(name) }

  async stop$() {
    await this.#pulse.stop()
    await this.is$('stopping')
  }

  async success$() {
    assert(!this.aborting)
    super.success$()
    await this.stop$()
  }

  async abort$() {
    assert(this.aborting)
    super.abort$()
    await this.stop$()
  }

  async fail$(code = EXIT_FAILURE) {
    assert(!this.aborting)
    super.fail$(code)
    await this.stop$()
  }

  async error$(error) {
    assert(!this.aborting)
    super.error$(error)
    await this.stop$()
  }

  get starting() { return this.state$ == 'starting' }
  get aborting() { return this.state$ == 'aborting' }
  get stopping() { return this.state$ == 'stopping' }

  toString() { return this.#state.toString() }
}

// CliDaemon.__dumpMetadata()
