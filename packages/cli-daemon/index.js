import { CliService } from '@kingjs/cli-service'
import { CliCommand } from '@kingjs/cli-command'

export class CliDaemonState extends CliService { 
  static consumes = [ 'beforeStart', 'beforeStop' ]
  static produces = [ 'is' ]
  static { this.initialize(import.meta) }

  constructor(options) { 
    if (CliDaemonState.initializing(new.target)) 
      return super()
    super(options)

    this.once('beforeStart', () => this.emit('is', 'starting'))
    this.once('beforeStop', () => this.emit('is', 'stopping'))
  }
}

export class CliDaemon extends CliCommand {
  static produces = [ 'beforeStart', 'beforeStop' ]
  static { this.initialize(import.meta) }

  constructor(options) {
    if (CliDaemon.initializing(new.target)) 
      return super()
    super(options)
  }

  async run(signal) {
    try {
      this.emit('beforeStart')
      return await this.start(signal)
    } finally {
      this.emit('beforeStop')
    }
  }

  async start(signal) { }
}

// CliDaemon.__dumpMetadata()
