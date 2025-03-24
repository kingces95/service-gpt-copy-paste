#!/usr/bin/env node
import { CliCommand, CliIn, CliOut, CliErr } from '@kingjs/cli-command'
import { CliProvider } from '@kingjs/cli-provider'
import { CliWritable, DEV_STDOUT } from '@kingjs/cli-writable'
import { CliEcho } from '@kingjs/cli-echo'
import os from 'os'
import assert from 'assert'

export class CliIs extends CliProvider { 
  static parameters = {
    stdis: 'Status stream',
  }
  static { this.initialize() }

  #path

  constructor({ stdis = DEV_STDOUT, ...rest } = { }) { 
    if (CliIs.initializing(new.target, { stdis })) 
      return super()
    super(rest)

    this.#path = stdis
  }
  
  async activate() { 
    return await CliWritable.fromPath(this.#path)
  }
}

export class CliDaemonState extends CliProvider { 
  static services = [ CliIs ]
  static { this.initialize() }

  #cliis
  #echo
  #state

  constructor(options) { 
    if (CliDaemonState.initializing(new.target)) 
      return super()
    super(options)

    this.#cliis = this.getService(CliIs)
    this.#echo = new CliEcho(this.#cliis)
  }

  get state() { return this.#state }

  async update(...fields) {
    await this.#echo.writeRecord(fields)
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
    const state = this.state
    return state.charAt(0).toUpperCase() + state.slice(1) + '...'
  }
}

export class CliPulse extends CliProvider {
  static parameters = {
    intervalMs: 'Cancellation polling',
    reportMs: 'Report interval',
  }
  static services = [ CliIn, CliOut, CliErr ]
  static { this.initialize() }

  constructor({ intervalMs = 100, reportMs = 1000, ...rest } = {}) {
    if (CliPulse.initializing(new.target, { intervalMs, reportMs }))
      return super()
    super(rest)

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
      
      const [ stdin, stdout, stderr ] = this.getService(CliIn, CliOut, CliErr)
      callback(stdin.count, stdout.count, stderr.count, totalCPU.toFixed(1), memoryUsage)
      ms = 0
    }
  }

  async stop() {
    this.running = false
  }
}

export class CliDaemon extends CliCommand {
  static services = [ CliDaemonState, CliPulse ]
  static { this.initialize() }

  #state
  #pulse

  constructor(options) {
    if (CliDaemon.initializing(new.target)) 
      return super()
    super(options)

    this.#state = this.getService(CliDaemonState)
    this.#pulse = this.getService(CliPulse)
    
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
