import { CliService } from '@kingjs/cli-service'
import { CliCommand } from '@kingjs/cli-command'
import { CliConsoleMon } from '@kingjs/cli-console'
import { AbortError } from '@kingjs/abort-error'

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
    runtime.once('beforeStart', () => console.is('starting'))
    runtime.once('afterStart', () => console.is('stopping'))
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
      runtime.emit('beforeStart')
      const result = await this.start(signal)
      return result

    } catch (error) {
      if (error instanceof AbortError) return
      throw error

    } finally {
      runtime.emit('afterStart')
    }
  }

  async start(signal) { }
}

// CliDaemon.__dumpMetadata()
