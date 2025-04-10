import { CliServiceMonitor } from '@kingjs/cli-service'
import { CliStdIn, CliStdOut } from '@kingjs/cli-std-stream'
import os from 'os'

export class CliPulse extends CliServiceMonitor {
  static parameters = {
    reportMs: 'Reporting rate',
    intervalMs: 'Cancellation polling rate',
  }
  static services = {
    stdin: CliStdIn,
    stdout: CliStdOut,
  }
  static produces = [ 'pulse' ]
  static { this.initialize(import.meta) }

  #stdin
  #stdout

  constructor({ reportMs = 1000, intervalMs = 100, ...rest } = {}) {
    if (CliPulse.initializing(new.target, { reportMs, intervalMs }))
      return super()
    super({ reportMs, intervalMs, ...rest })

    const { stdin, stdout } = this.getServices(CliPulse)
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
    this.emit('pulse', 
      stdin.count, stdout.count, 0, totalCPU.toFixed(1), memoryUsage)

    return { prevCPU: process.cpuUsage() }
  }
}
