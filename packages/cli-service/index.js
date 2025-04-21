import { Cli } from '@kingjs/cli'

export class CliService extends Cli {
  static { this.initialize(import.meta) }

  constructor(options) {
    if (CliService.initializing(new.target, { })) 
      return super()

    super(options)
  }

  async dispose() { }
}

export class CliServiceThread extends CliService {
  static { this.initialize(import.meta) }

  constructor(options) {
    if (CliServiceThread.initializing(new.target))
      return super()
    super(options)
  }

  async start(signal) { }
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

export class CliServiceProvider extends Cli {
  static { this.initialize(import.meta) }

  constructor(options) {
    if (CliServiceProvider.initializing(new.target, { })) 
      return super()

    super(options)
  }

  async activate() { return this }
  
  async dispose() { }
}

// Cli.__dumpMetadata()
