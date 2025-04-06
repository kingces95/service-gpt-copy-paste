#!/usr/bin/env node
import { CliService, CliServiceThread } from '@kingjs/cli-service'
import { 
  CliCommand, CliStdIn, CliStdOut 
} from '@kingjs/cli-command'
import { CliConsoleMon } from '@kingjs/cli-runtime'
import { AbortError } from '@kingjs/abort-error'
import os from 'os'

export class CliDaemonState extends CliService { 
  static services = {
    console: CliConsoleMon,
  }
  static { this.initialize(import.meta) }

  constructor(options) { 
    if (CliDaemonState.initializing(new.target)) 
      return super()
    super(options)

    const { console } = this.getServices(CliDaemonState, options)

    const { runtime } = this
    runtime.once('beforeStart', async () => { await console.is('starting') })
    runtime.once('afterStart', async () => { await console.is('stopping') })
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
  }
  static { this.initialize(import.meta) }

  constructor(options) {
    if (CliDaemon.initializing(new.target)) 
      return super()

    super(options)

    this.getServices(CliDaemon, options)
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
}

// CliDaemon.__dumpMetadata()
