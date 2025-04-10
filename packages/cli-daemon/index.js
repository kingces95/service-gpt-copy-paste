import { CliService } from '@kingjs/cli-service'
import { CliCommand } from '@kingjs/cli-command'
import { AbortError } from '@kingjs/abort-error'

export class CliDaemonState extends CliService { 
  static consumes = [ 'beforeStart', 'afterstart' ]
  static produces = [ 'is' ]
  static { this.initialize(import.meta) }

  constructor(options) { 
    if (CliDaemonState.initializing(new.target)) 
      return super()
    super(options)

    this.once('beforeStart', () => this.emit('is', 'starting'))
    this.once('afterStart', () => this.emit('is', 'stopping'))
  }
}

export class CliDaemon extends CliCommand {
  static produces = [ 'beforeStart', 'afterStart' ]
  static { this.initialize(import.meta) }

  constructor(options) {
    if (CliDaemon.initializing(new.target)) 
      return super()
    super(options)
  }

  async execute(signal) {
    try {
      this.emit('beforeStart')
      const result = await this.start(signal)
      return result

    } catch (error) {
      if (error instanceof AbortError) return
      throw error

    } finally {
      this.emit('afterStart')
    }
  }

  async start(signal) { }
}

// CliDaemon.__dumpMetadata()
